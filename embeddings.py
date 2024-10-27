from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from sklearn.decomposition import PCA
from scipy.spatial.distance import cosine, euclidean
import numpy as np
from tenacity import retry, stop_after_attempt, wait_random_exponential
from typing import List
import os

openai_client = OpenAI(api_key=os.environ['OPENAI_KEY'])

app = Flask(__name__)
CORS(app)  # enable CORS


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
def get_embeddings(list_of_text: List[str],
                   model="text-embedding-ada-002",
                   **kwargs) -> List[List[float]]:
    assert len(
        list_of_text) <= 2048, "The batch size should not be larger than 2048."

    # replace newlines, which can negatively affect performance.
    list_of_text = [text.replace("\n", " ") for text in list_of_text]

    data = openai_client.embeddings.create(input=list_of_text,
                                           model=model,
                                           **kwargs).data

    print(data)
    # maintain the same order as input.
    data = sorted(data, key=lambda x: x.index)
    return [d.embedding for d in data]


def get_score(items: List, model: str):
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
        "model": model,
        "similarity": similarity_dict,
        "pca": pca_dict
    }

    return scoring_result


@app.route("/process", methods=['POST'])
def process():
    data = request.get_json()
        
    assert data["model"] in [
        "text-embedding-3-small",
        "text-embedding-3-large",
        "text-embedding-ada-002"
    ]

    items = get_score(data["items"], model=data["model"])
    return jsonify(items)


# print(
#     json.dumps(get_score([
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
