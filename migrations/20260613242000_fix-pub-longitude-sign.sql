-- Fix pubs saved with positive SF longitudes (e.g. 122.41 instead of -122.41)

UPDATE public.pubs
SET lng = -ABS(lng)
WHERE lat BETWEEN 36 AND 39
  AND lng > 0
  AND lng BETWEEN 120 AND 125;
