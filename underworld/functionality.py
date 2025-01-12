import base64
import json
from openai import OpenAI
from sklearn.decomposition import PCA
from scipy.spatial.distance import cosine, euclidean
import numpy as np
from tenacity import retry, stop_after_attempt, wait_random_exponential
from typing import List
import os
import dotenv
import vertexai.language_models
import voyageai.client as voyageai
import vertexai
from google.oauth2 import service_account

import os
from supabase.client import create_client, Client

dotenv.load_dotenv()

url: str = os.environ["SUPABASE_URL"]
key: str = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(url, key)

credentials = service_account.Credentials.from_service_account_info(
    json.loads(base64.b64decode(os.environ['GOOGLE_CREDENTIALS']))
)

vertexai.init(credentials=credentials, project=credentials.project_id)

openai_client = OpenAI(api_key=os.environ['OPENAI_KEY'])
nvidia_client = OpenAI(
  api_key=os.environ['NVIDIA_KEY'],
  base_url="https://integrate.api.nvidia.com/v1"
)
voyage_client = voyageai.Client(api_key=os.environ['VOYAGE_KEY'])

class EmbeddingModel():
    def __init__(self, model_id: str):
        self.model_id = model_id
        raise NotImplementedError

    def create(self, list_of_texts: list[str]):
        raise NotImplementedError

    def charge(self, texts: list[str], price: float):
        supabase.table("calls").insert({
            "model": self.model_id,
            "texts": texts,
            "price": price
        }).execute()

class EmbeddingModelBasedOnOpenAI(EmbeddingModel):
    def __init__(self, model_id: str, *, api_key: str,
            local_name: str | None = None, base_url: str | None=None, create_kwargs = {}
        ):
        self.model_id = model_id
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.api_key = api_key

        self.local_name = local_name
        self.base_url = base_url
        self.create_kwargs = create_kwargs
    
    def create(self, list_of_texts: list[str]):
        floatie = self.client.embeddings.create(
            input=list_of_texts,
            model=self.local_name or self.model_id,
            **self.create_kwargs
        )
        
        price = self.calculate_price(floatie.usage.total_tokens)
        self.charge(list_of_texts, price)

        data = sorted(floatie.data, key=lambda x: x.index)

        # maintain the same order as input.
        return [d.embedding for d in data]

    def calculate_price(self, tokens: int):
        tokens_divided_by_million = tokens / 1_000_000

        if self.model_id == "openai/text-embedding-ada-002":
            return (tokens_divided_by_million * 0.1) * 1.2
        elif self.model_id == "openai/text-embedding-3-small":
            return (tokens_divided_by_million * 0.020) * 1.2
        elif self.model_id == "openai/text-embedding-3-large":
            return (tokens_divided_by_million * 0.130) * 1.2
        elif self.model_id == "nvidia/nv-embed-v1":
            return (tokens_divided_by_million * 0.1) * 1.2
        else:
            raise NotImplementedError
    
class EmbeddingModelBasedOnVoyageAI(EmbeddingModel):
    def __init__(self, model_id: str, *, api_key: str):
        self.client = voyageai.Client(api_key=api_key)
        self.model_id = model_id
    
    def create(self, list_of_texts: list[str]):
        local_name = self.model_id.replace("voyageai/", "")
        floatie = self.client.embed(
            texts=list_of_texts,
            model=local_name
        )

        price = self.calculate_price(floatie.total_tokens)
        self.charge(list_of_texts, price)

        return floatie.embeddings

    def calculate_price(self, tokens: int):
        tokens_divided_by_million = tokens / 1_000_000

        if self.model_id == "voyageai/voyage-3-lite":
            return (tokens_divided_by_million * 0.02) * 1.2
        elif self.model_id == "voyageai/voyage-3":
            return (tokens_divided_by_million * 0.06) * 1.2
        elif self.model_id == "voyageai/voyage-3-large":
            return (tokens_divided_by_million * 0.18) * 1.2
        else:
            raise NotImplementedError(f"Model {self.model_id} not supported.")

class EmbeddingModelBasedOnGoogle(EmbeddingModel):
    def __init__(self, model_id: str):
        self.model_id = model_id

        local_name = model_id.replace("google/", "")
        self.model = vertexai.language_models.TextEmbeddingModel.from_pretrained(local_name)
    
    def create(self, list_of_texts: list[str]):
        # Is truncating inputs if texts too long.
        floatie = self.model.get_embeddings(texts=list_of_texts)
        price = self.calculate_price(list_of_texts)
        self.charge(list_of_texts, price)
        
        return [f.values for f in floatie]

    def calculate_price(self, list_of_texts: list[str]):
        characters_divided_by_1000 = sum([len(text) for text in list_of_texts]) / 1000
        return (characters_divided_by_1000 * 0.000025) * 1.2
    
@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(2))
def get_embeddings(list_of_text: List[str],
                   model: EmbeddingModel) -> List[List[float]]:
    assert len(
        list_of_text) <= 2048, "The batch size should not be larger than 2048."

    # replace newlines, which can negatively affect performance.
    list_of_text = [text.replace("\n", " ") for text in list_of_text]

    data = model.create(list_of_text)

    return data

def get_score(items: list[dict], model: EmbeddingModel):
    texts = [item['text'] for item in items]
    matrix = get_embeddings(texts, model)

    pca = PCA(n_components=3)
    vis_dims = pca.fit_transform(matrix)

    # PCA
    pca_dict = {}
    for i, item in enumerate(items):
        id = item['id']
        pca_dict[id] = {
            "x": vis_dims[i][0],
            "y": vis_dims[i][1],
            "z": vis_dims[i][2]
        }

    # Similarity
    similarity_dict = {"cosine": {}, "dot_product": {}, "euclidean": {}}
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            id_i = items[i]['id']
            id_j = items[j]['id']

            cosine_score = cosine(matrix[i], matrix[j])
            euclidean_score = euclidean(matrix[i], matrix[j])
            dot_product_score = np.dot(matrix[i], matrix[j])

            for score_dict, score in [("cosine", cosine_score),
                                      ("euclidean", euclidean_score),
                                      ("dot_product", dot_product_score)]:
                if id_i not in similarity_dict[score_dict]:
                    similarity_dict[score_dict][id_i] = {}
                if id_j not in similarity_dict[score_dict]:
                    similarity_dict[score_dict][id_j] = {}

                similarity_dict[score_dict][id_i][id_j] = score
                similarity_dict[score_dict][id_j][id_i] = score

    # Creating the ScoringResult object
    scoring_result = {
        "model": model.model_id,
        "similarity": similarity_dict,
        "pca": pca_dict
    }

    return scoring_result

MODELS = [
    "openai/text-embedding-3-small",
    "openai/text-embedding-3-large",
    "openai/text-embedding-ada-002",
    "nvidia/nv-embed-v1",
    "voyageai/voyage-3-large",
    "voyageai/voyage-3-lite",
    "voyageai/voyage-3",
    "google/text-embedding-004",
    "google/text-embedding-005"
]

def get_comparison(model_id: str, items: list[dict]):
    assert model_id in MODELS, f"Model {model_id} not supported."

    if model_id.startswith("openai/"):
        model = EmbeddingModelBasedOnOpenAI(
            model_id=model_id,
            api_key=os.environ['OPENAI_KEY'],
            local_name=model_id.replace("openai/", "")
        )
    elif model_id.startswith("nvidia/"):
        model = EmbeddingModelBasedOnOpenAI(
            model_id=model_id,
            api_key=os.environ['NVIDIA_KEY'],
            base_url="https://integrate.api.nvidia.com/v1",
            create_kwargs=dict(
                encoding_format="float",
                extra_body={"input_type": "passage", "truncate": "NONE"}
            )
        )
    elif model_id.startswith("voyageai/"):
        model = EmbeddingModelBasedOnVoyageAI(
            model_id=model_id,
            api_key=os.environ['VOYAGE_KEY'],
        )
    elif model_id.startswith("google/"):
        model = EmbeddingModelBasedOnGoogle(
            model_id=model_id
        )

    return get_score(items, model=model)
