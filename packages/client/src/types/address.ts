export interface AddressInput {
  label: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AddressResponse extends AddressInput {
  id: string;
  userId: string;
  createdAt: string;
}
