export interface AddressInput {
  label: string;
  street1: string;
  street2?: string;
  city: string;
  zipCode: number;
}

export interface AddressResponse extends AddressInput {
  id: string;
  userId: string;
  createdAt: string;
}
