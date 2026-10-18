export function make(category) {
  return (id, name, recipe, description, shape, palette = null, motif = null) => ({
    id,
    name,
    category,
    recipe,
    description,
    shape,
    palette,
    motif,
  });
}
