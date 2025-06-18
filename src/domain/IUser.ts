export interface User {
    id: number; // Cambiado de id_user a id para coincidir con la nueva estructura
    name: string;
    surname: string;
    email: string;
    role: string;
    // Campos adicionales que pueden estar en la respuesta completa del registro
    phoneNumber?: string;
    district?: string;
    address?: string;
}
