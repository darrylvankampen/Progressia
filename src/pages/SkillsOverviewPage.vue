<template>
  <div>
    <SkillsOverview @openSkill="openSkillPage" />
  </div>
</template>

<script setup>
import SkillsOverview from "../components/skills/SkillsOverview.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function openSkillPage(name) {
  router.push(`/skill/${name}`);
}
</script>
