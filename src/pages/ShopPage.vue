<template>
  <div class="card shadow text-light">
    <div class="card-body">
      <h3 class="mb-3">🛒 Shop</h3>
      <p class="opacity-75">Buy items, tools, upgrades and more!</p>

      <div class="row g-3">
        <div v-for="i in shopItems" :key="i.id" class="col-12 col-md-4">
          <div class="shop-card p-3">
            <img :src="i.icon" class="shop-icon" />
            <h5 class="mt-2">{{ i.name }}</h5>
            <p class="small opacity-75">{{ i.description }}</p>

            <button class="btn btn-success w-100">Buy {{ i.price }}g</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const shopItems = [
  {
    id: "tool_axe_1",
    name: "Basic Axe",
    description: "Increases woodcutting speed.",
    icon: "/icons/items/tools/bronze_axe.png",
    price: 50,
  },
  {
    id: "tool_pickaxe_1",
    name: "Basic Pickaxe",
    description: "Increases mining speed.",
    icon: "/icons/items/pickaxe_basic.png",
    price: 60,
  }
];
</script>

<style scoped>
.shop-card {
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.1);
  text-align: center;
  transition: 0.2s;
}

.shop-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 12px rgba(255,255,255,0.2);
}

.shop-icon {
  width: 64px;
  height: 64px;
}
</style>
