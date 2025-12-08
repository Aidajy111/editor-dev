export type Model = {
    id: number
    name: string
    image: string
    camera: string
    edges: string
}

export type Brand = {
    id: number
    label: string
    models: Model[]
}
