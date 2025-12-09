<template>
  <div class="shop-page">
    <SectionHeader title="General Store" icon="/icons/ui/shop.png" />

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
import SectionHeader from "../components/ui/SectionHeader.vue";
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
/* LAYOUT ------------------------------------------------------------------ */
.shop-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 28px;
  padding: 24px;
}

/* SIDEBAR ----------------------------------------------------------------- */
.shop-categories {
  background: #181818;
  padding: 18px;
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.category-title {
  font-size: 1.2rem;
  margin-bottom: 14px;
  opacity: 0.8;
  font-weight: 600;
}

.category-item {
  position: relative;
  background: #222;
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  transition: 0.25s ease;
  margin-bottom: 10px;
  overflow: hidden;
}

.category-item:hover {
  background: #2a2a2a;
  transform: translateX(3px);
}

/* Accent bar (animated) */
.category-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 100%;
  background: #6bd66e;
  border-radius: 5px;
  box-shadow: 0 0 6px #6bd66e;
}

.category-item.active {
  background: #2e2e2e;
  color: white;
  transform: translateX(4px);
}

.category-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 28px;
  opacity: 0.9;
}

/* SHOP GRID --------------------------------------------------------------- */
.shop-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 26px;
}

/* ITEM CARD --------------------------------------------------------------- */
.shop-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 20px;
  background: #1c1c1c;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: 0.25s ease;
}

.shop-card:hover {
  transform: translateY(-4px);
  border-color: #6bd66e;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}

.icon-ring.medium.glow {
  background: #252525;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #6bd66e;
  box-shadow: 0 0 10px rgba(107, 214, 110, 0.4);
}

.item-icon {
  width: 48px;
}

/* TEXT -------------------------------------------------------------------- */
.info {
  flex: 1;
}

.item-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.description {
  opacity: 0.75;
  font-size: 0.9rem;
  margin-top: 4px;
}

.extra {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  font-size: 0.82rem;
  opacity: 0.9;
}

.req {
  color: #ffb347;
}

.stock {
  color: #6bd66e;
}

/* PRICE & BUY ------------------------------------------------------------- */
.price-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.price-wrapper {
  text-align: right;
}

.price {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  font-weight: 600;
}

.gold-icon {
  width: 20px;
}

.sale-badge {
  background: #6bd66e;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-top: 4px;
  color: #111;
  font-weight: 700;
  box-shadow: 0 0 6px rgba(107, 214, 110, 0.5);
}

/* BUY BUTTON -------------------------------------------------------------- */
.buy-btn {
  background: linear-gradient(135deg, #6bd66e, #4dbd50);
  border: none;
  padding: 10px 20px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  color: #1a1a1a;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 0 8px #6bd66e;
  transition: 0.25s ease;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.03);
  filter: brightness(1.12);
}

.buy-btn:disabled {
  background: #555;
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}
</style>