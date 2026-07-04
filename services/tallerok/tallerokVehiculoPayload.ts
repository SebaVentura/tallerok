import type {
  TallerOkCreateVehiculoPayload,
  TallerOkUpdateVehiculoPayload,
} from '@/types/tallerokApi';

type ApiVehiculoBody = Record<string, unknown>;

export function toApiVehiculoBody(
  payload: TallerOkCreateVehiculoPayload | TallerOkUpdateVehiculoPayload,
): ApiVehiculoBody {
  const { km, notas, observaciones, kilometraje, ...rest } = payload;
  const body: ApiVehiculoBody = { ...rest };

  const kmValue = km ?? kilometraje;
  if (kmValue != null) {
    body.km = kmValue;
    body.kilometraje = kmValue;
  }

  const notes = notas ?? observaciones;
  if (notes != null && notes !== '') {
    body.notas = notes;
    body.observaciones = notes;
  }

  return body;
}
