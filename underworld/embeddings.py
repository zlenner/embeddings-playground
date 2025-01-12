import base64
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
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

dotenv.load_dotenv()

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
    def __init__(self, name: str):
        self.name = name
        raise NotImplementedError

    def create(self, list_of_texts: list[str]):
        raise NotImplementedError

class EmbeddingModelBasedOnOpenAI(EmbeddingModel):
    def __init__(self, api_key, name, base_url=None, *, create_kwargs = {}):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.base_url = base_url
        self.api_key = api_key
        self.name = name
        self.create_kwargs = create_kwargs
    
    def create(self, list_of_texts: list[str]):
        floatie = self.client.embeddings.create(
            input=list_of_texts,
            model=self.name,
            **self.create_kwargs
        )

        data = sorted(floatie.data, key=lambda x: x.index)

        # maintain the same order as input.
        return [d.embedding for d in data]

class EmbeddingModelBasedOnVoyageAI(EmbeddingModel):
    def __init__(self, api_key, name):
        self.client = voyageai.Client(api_key=api_key)
        self.name = name
    
    def create(self, list_of_texts: list[str]):
        floatie = self.client.embed(
            texts=list_of_texts,
            model=self.name
        )
        return floatie.embeddings

class EmbeddingModelBasedOnGoogle(EmbeddingModel):
    def __init__(self, name):
        self.model = vertexai.language_models.TextEmbeddingModel.from_pretrained(name)
        self.name = name
    
    def create(self, list_of_texts: list[str]):
        # is truncating inputs if texts too long
        floatie = self.model.get_embeddings(texts=list_of_texts)
        return [f.values for f in floatie]
    
app = Flask(__name__)
CORS(app)  # enable CORS

@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
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
        "model": model.name,
        "similarity": similarity_dict,
        "pca": pca_dict
    }

    return scoring_result

def get_comparison(model_name: str, items: list[dict]):
    assert model_name in [
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

    if model_name.startswith("openai/"):
        model = EmbeddingModelBasedOnOpenAI(
            api_key=os.environ['OPENAI_KEY'],
            name=model_name.replace("openai/", ""),
        )
    elif model_name.startswith("nvidia/"):
        model = EmbeddingModelBasedOnOpenAI(
            api_key=os.environ['NVIDIA_KEY'],
            name=model_name,
            base_url="https://integrate.api.nvidia.com/v1",
            create_kwargs=dict(
                encoding_format="float",
                extra_body={"input_type": "passage", "truncate": "NONE"}
            )
        )
    elif model_name.startswith("voyageai/"):
        model = EmbeddingModelBasedOnVoyageAI(
            api_key=os.environ['VOYAGE_KEY'],
            name=model_name.replace("voyageai/", "")
        )
    elif model_name.startswith("google/"):
        model_id = model_name.replace("google/", "")
        model = EmbeddingModelBasedOnGoogle(
            name=model_id
        )
    
    return get_score(items, model=model)


@app.route("/process", methods=['POST'])
def process():
    data = request.get_json()

    result = get_comparison(model_name=data["model"], items=data["items"])
    
    return jsonify(result)

# print(
#     json.dumps(get_comparison("google/text-embedding-005", items=[
#         {
#             "id": "Golang",
#             "color": "",
#             "text": "Golang",
#         },
#         {
#             "id": "Python",
#             "color": "",
#             "text": "Python",
#         },
#         {
#             "id": "Node.js",
#             "color": "",
#             "text": "Node.js",
#         },
#         {
#             "id": "Go",
#             "color": "",
#             "text": "Go",
#         },
#     ]),
#                indent=4))

if __name__ == "__main__":

    app.run(host="0.0.0.0", port=8080)
