export async function fetchSvg(url) {
  const res = await fetch(url);
  return await res.text();
}
