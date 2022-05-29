import {Model} from 'mongoose';
export interface PluginProps<T> extends Model<T> {
  secret: string;
  algorithm: string;
  keyAltName: string;
  keyVaultNamespace:
    | 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
    | 'AEAD_AES_256_CBC_HMAC_SHA_512-Random';
}
