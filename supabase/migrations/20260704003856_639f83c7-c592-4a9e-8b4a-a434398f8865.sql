UPDATE public.activation_tokens SET used_at = now() WHERE user_id = '35d5b763-411a-4d3b-96ca-f48d1f813bbd' AND used_at IS NULL;
INSERT INTO public.activation_tokens (user_id, token_hash, expires_at)
VALUES ('35d5b763-411a-4d3b-96ca-f48d1f813bbd', 'ac04d19a0950004c761da5dd1158fbe5c3cf788dc95d3b1bb9b8d628cd532dd4', now() + interval '48 hours');