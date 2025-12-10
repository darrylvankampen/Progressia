<template>
  <div class="shop-page">
    <h2>General Shop</h2>
    <div class="shop-layout">
      <!-- CATEGORY SIDEBAR -->
      <div class="shop-categories card-style">
        <h3 class="category-title">Categories</h3>

        <div v-for="c in shop.categories" :key="c.id" class="category-item" :class="{ active: c.id === activeCategory }"
          @click="activeCategory = c.id">
          <div class="category-inner">
            <img :src="c.icon" class="category-icon" />
            <span>{{ c.label }}</span>
          </div>
        </div>
      </div>

      <!-- SHOP ITEMS ------------------------------------------------------- -->
      <div class="shop-items">
        <div v-for="entry in activeItems" :key="entry.itemId" class="shop-card">
          <!-- ICON -------------------------------------------------------- -->
          <div class="icon-ring medium glow">
            <img :src="entry.item.icon" class="item-icon" />
          </div>

          <!-- TEXT --------------------------------------------------------- -->
          <div class="info">
            <h3 class="item-name">{{ entry.item.name }}</h3>

            <p class="description">
              {{ entry.item.description }}
            </p>

            <div class="extra">
              <span v-if="entry.requiresLevel" class="req">
                <strong>Lv {{ entry.requiresLevel }}</strong>
                (You: {{ skillLevel(entry.skill) }})
              </span>

              <span v-if="entry.stock !== undefined && entry.stock !== -1" class="stock">
                Stock: {{ entry.stock }}
              </span>
            </div>
          </div>

          <!-- PRICE & BUY --------------------------------------------------- -->
          <div class="price-box">
            <div class="price-wrapper">
              <div class="price">
                <img src="/icons/ui/gold.png" class="gold-icon" />
                <span>{{ finalPrice(entry) }}</span>
              </div>

              <div v-if="entry.salePercent" class="sale-badge">
                -{{ entry.salePercent }}%
              </div>
            </div>

            <button class="buy-btn" :disabled="!canBuyUI(entry)" @click="tryBuy(entry)">
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { getShop, canBuy, buyFromShop } from "../game/ShopEngine";
import { getGame } from "../game/state/gameState";
import { useNotifications } from "../composables/useNotification";

const shopId = "general_store";
const shop = getShop(shopId);

const activeCategory = ref(shop.categories[0]?.id || null);
const { pushNotification } = useNotifications();

const activeItems = computed(() => {
  return shop.categories.find(c => c.id === activeCategory.value)?.items || [];
});

function finalPrice(entry) {
  if (entry.salePercent) {
    return Math.floor(entry.price * (1 - entry.salePercent / 100));
  }
  return entry.price;
}

function skillLevel(skill) {
  const game = getGame();
  return game.skills?.[skill]?.level ?? 0;
}

// Wrap canBuy() into something UI-friendly
function canBuyUI(entry) {
  const check = canBuy(entry, entry.item);
  return check.canBuy;
}

function tryBuy(entry) {
  const result = buyFromShop(shopId, activeCategory.value, entry.itemId);

  if (!result.bought) {
    pushNotification("shop", {
      message: result.reason,
      type: "warning"
    });
    return;
  }

  pushNotification("shop", {
    message: `Bought ${entry.item.name}!`,
    type: "success"
  });
}
</script>

<style scoped>
/* ========================================= */
/* SHOP LAYOUT (OSRS-HD PANEL) */
/* ========================================= */

.shop-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 28px;
  padding: 24px;

  background: radial-gradient(circle at center, #2c2c2c 0%, #1b1b1b 100%);
  border-radius: 12px;
  border: 1px solid #4f4f4f55;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 0 12px rgba(255, 255, 255, 0.03);
}

/* ========================================= */
/* CATEGORY SIDEBAR — Modern OSRS-HD Buttons */
/* ========================================= */

.shop-categories {
  padding: 20px;
  background: linear-gradient(145deg, #343434, #1e1e1e);
  border-radius: 12px;
  border: 1px solid #6c6c6c44;
  box-shadow:
    inset 0 0 8px rgba(255, 255, 255, 0.05),
    0 4px 10px rgba(0, 0, 0, 0.45);
}

.category-title {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.category-item {
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  cursor: pointer;

  background: linear-gradient(145deg, #2b2b2b, #1c1c1c);
  border: 1px solid #5a5a5a33;

  transition:
    transform .15s ease,
    border-color .15s ease,
    box-shadow .15s ease;
}

.category-item:hover {
  transform: translateX(4px);
  border-color: #8ab5ff66;
  box-shadow: 0 0 10px #8ab5ff33;
}

.category-item.active {
  border-color: #8ab5ff;
  background: linear-gradient(145deg, #3c3c3c, #242424);
  box-shadow:
    0 0 12px #8ab5ff55,
    inset 0 0 6px rgba(255, 255, 255, 0.05);
}

.category-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 28px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
}

/* ========================================= */
/* SHOP ITEM GRID */
/* ========================================= */

.shop-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 26px;
}

/* ========================================= */
/* SHOP CARD (Modern OSRS-HD Panel Card) */
/* ========================================= */

.shop-card {
  display: flex;
  gap: 20px;
  padding: 22px;
  border-radius: 14px;

  background: linear-gradient(145deg, #323232, #1a1a1a);
  border: 1px solid #6c6c6c44;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.4),
    inset 0 0 10px rgba(255, 255, 255, 0.04),
    inset 0 0 6px rgba(0, 0, 0, 0.3);

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.shop-card:hover {
  transform: translateY(-6px);
  border-color: #8ab5ff88;
  box-shadow:
    0 0 18px #8ab5ff44,
    inset 0 0 12px rgba(255, 255, 255, 0.06);
}

/* Icon ring → OSRS-HD glow version */
.icon-ring.medium.glow {
  width: 70px;
  height: 70px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(145deg, #2f2f2f, #1c1c1c);
  border: 2px solid #8ab5ff55;

  box-shadow:
    0 0 10px #8ab5ff44,
    inset 0 0 8px rgba(255, 255, 255, 0.05);
}

.item-icon {
  width: 48px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}

/* ========================================= */
/* ITEM TEXT */
/* ========================================= */

.info {
  flex: 1;
}

.item-name {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.95;
  letter-spacing: 0.3px;
}

.description {
  opacity: 0.75;
  margin-top: 4px;
  font-size: 0.92rem;
}

.extra {
  margin-top: 10px;
  display: flex;
  gap: 16px;
  font-size: 0.82rem;
}

.req {
  color: #ffdf85;
}

.stock {
  color: #8aff9e;
}

/* ========================================= */
/* PRICE & BUY AREA */
/* ========================================= */

.price-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.price-wrapper {
  text-align: right;
}

.price {
  display: flex;
  align-items: center;
  gap: 6px;

  font-size: 1.15rem;
  font-weight: 600;
  opacity: 0.95;
}

.gold-icon {
  width: 20px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.sale-badge {
  background: #8aff9e;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #111;
  box-shadow: 0 0 6px #8aff9e77;
}

/* ========================================= */
/* BUY BUTTON — OSRS-HD BUTTON */
/* ========================================= */

.buy-btn {
  background: linear-gradient(145deg, #3a71ff, #295bcc);
  border: 1px solid #7ea9ff55;

  padding: 10px 22px;
  border-radius: 10px;

  cursor: pointer;
  font-weight: 700;
  color: white;
  letter-spacing: 0.4px;

  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 10px #87b7ff44;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.03);
  box-shadow:
    0 0 12px #8ab5ff66,
    inset 0 0 10px rgba(255, 255, 255, 0.1);
}

.buy-btn:disabled {
  opacity: 0.35;
  box-shadow: none;
  cursor: not-allowed;
}
</style>