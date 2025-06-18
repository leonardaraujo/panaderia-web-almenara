// Actualizada la interfaz para coincidir con ProductCatalog
export interface Product {
    name: string;
    imgUrl: string; // Cambiado de 'img' a 'imgUrl'
    text: string;
    price: number;
}