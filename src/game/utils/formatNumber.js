export function formatNumber(num) {
  if (num < 1000) return num.toString();

  const units = [
    "K",  // Thousand
    "M",  // Million
    "B",  // Billion
    "T",  // Trillion
    "Qa", // Quadrillion
    "Qi", // Quintillion
    "Sx", // Sextillion
    "Sp", // Septillion
    "Oc", // Octillion
    "No", // Nonillion
    "Dc"  // Decillion
  ];

  let unitIndex = -1;

  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }

  return num.toFixed(1).replace(/\.0$/, "") + units[unitIndex];
}
