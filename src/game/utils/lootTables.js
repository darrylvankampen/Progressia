export function rollFromLootTable(table) {
    const { rolls, loot } = table;
    const results = [];

    for (let i = 0; i < rolls; i++) {
        const totalWeight = loot.reduce((a, b) => a + b.weight, 0);
        const r = Math.random() * totalWeight;

        let acc = 0;
        for (const entry of loot) {
            acc += entry.weight;
            if (r <= acc) {
                const amount = randomInt(entry.min, entry.max);
                results.push({ item: entry.item, amount });
                break;
            }
        }
    }

    return results;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
