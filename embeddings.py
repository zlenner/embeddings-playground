import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
from sklearn.decomposition import PCA
from scipy.spatial.distance import cosine, euclidean
import numpy as np
from tenacity import retry, stop_after_attempt, wait_random_exponential
from typing import List

app = Flask(__name__)
CORS(app)  # enable CORS

@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
def get_embeddings(list_of_text: List[str], engine="text-embedding-ada-002", **kwargs) -> List[List[float]]:
    assert len(list_of_text) <= 2048, "The batch size should not be larger than 2048."

    # replace newlines, which can negatively affect performance.
    list_of_text = [text.replace("\n", " ") for text in list_of_text]

    data = openai.Embedding.create(input=list_of_text, engine=engine, **kwargs).data
    
    # maintain the same order as input.
    data = sorted(data, key=lambda x: x["index"])
    return [d["embedding"] for d in data]


openai.api_key = "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"


def get_score(items):
    texts = [item['text'] for item in items]
    matrix = get_embeddings(texts)

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
        "model": "text-embedding-ada-002",
        "similarity": similarity_dict,
        "pca": pca_dict
    }

    return scoring_result


@app.route("/process", methods=['POST'])
def process():
    data = request.get_json()
    items = get_score(data)
    return jsonify(items)

# if __name__ == "__main__":
#   app.run(host="0.0.0.0")

# data = [
#     {
#         "id": "76bc24027ca845b6b132f106e9c4049369536bc0",
#         "color": "#F3F3A4",
#         "text": "Manchester Football"
#     },
#     {
#         "id": "a22e89801cd166fc6a33ad809e6e11fd09f54250",
#         "color": "#fabc4b",
#         "text": "Man Utd"
#     },
#     {
#         "id": "3d5a3e3c290f07af5c1a6131c80f0b462431d2be",
#         "color": "orange",
#         "text": "Red Devils"
#     },
#     {
#         "id": "14c38c1439cdcd72121bc3455be84f8f61ebe64c",
#         "color": "#DA291C",
#         "text": "Manchester United"
#     },
#     {
#         "id": "c1b9627d8895b9133f95c0e39a6b60131d2ad9c8",
#         "color": "#6CABDD",
#         "text": "Manchester City"
#     },
#     {
#         "id": "c85066aee193be5e172942973a1b982c643df842",
#         "color": "blue",
#         "text": "ManCity"
#     },
#     {
#         "id": "226f1f50ad5b693462a6b9ddb98f1a0b75ff2269",
#         "color": "#000000",
#         "text": "Marcus Rashford"
#     },
#     {
#         "id": "37e7db6b0b784f96fc5b7de1cb3980b8979098e2",
#         "color": "#FFC0CB",
#         "text": "kevin de bruyne"
#     }
# ]


print(json.dumps(get_score([
    {
      "id": "Golang",
      "color": "",
      "text": "Golang",
      },
    {
        "id": "Python",
        "color": "",
        "text": "Python",
    },
    {
        "id": "Node.js",
        "color": "",
        "text": "Node.js",
    },
    {
        "id": "Go",
        "color": "",
        "text": "Go",
    },
]), indent=4))
