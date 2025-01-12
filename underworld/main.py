from flask import Flask
from flask_cors import CORS
from flask import Flask, request, jsonify

from functionality import get_comparison, get_funds_account

app = Flask(__name__)
CORS(app)  # enable CORS

@app.route("/process", methods=['POST'])
def process():
    data = request.get_json()

    if "model" not in data:
        return jsonify({"error": "Model not specified."})
    elif "items" not in data:
        return jsonify({"error": "'items' not specified."})
    elif not isinstance(data["items"], list):
        return jsonify({"error": "items should be a list."})
    elif len(data["items"]) < 2:
        return jsonify({"error": "At least 2 items are required."})
    elif len(data["items"]) > 20:
        return jsonify({"error": "The number of items should not exceed 20."})

    result = get_comparison(model_id=data["model"], items=data["items"])
    
    return jsonify(result)

@app.route("/remaining_funds", methods=['GET'])
def remaining_funds():
    return jsonify(get_funds_account().to_dict())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
