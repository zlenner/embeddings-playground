export interface ColorItem {
    id: string;
    color: string;
    text: string;
}

type Similarity = {
    [main_id: string]: {
        [comparision_id: string]: number
    }
}

export type PCA = {
    [id: string]: {
        x: number
        y: number
        z: number
    }
}

export interface ScoringResult {
    model: string
    similarity: {
        cosine: Similarity
        dot_product: Similarity
        euclidean: Similarity
    }
    pca: PCA
}
