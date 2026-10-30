import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Material {
    content: string;
    owner: Principal;
    name: string;
}
export interface backendInterface {
    countMaterialsByUser(user: Principal): Promise<bigint>;
    deleteMaterial(name: string): Promise<void>;
    getContent(name: string): Promise<string>;
    getMaterial(name: string): Promise<Material>;
    getMaterialsByOwner(owner: Principal): Promise<Array<Material>>;
    getOwner(name: string): Promise<Principal>;
    listMaterials(): Promise<Array<Material>>;
    updateContent(name: string, newContent: string): Promise<void>;
    uploadMaterial(name: string, content: string): Promise<void>;
}
