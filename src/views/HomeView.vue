<script setup lang="ts">
import ChatView from './ChatView.vue'
</script>

<template>
  <div class="home-container">
    <ChatView />
  </div>
</template>

<style scoped>
.home-container {
  min-height: calc(100vh - 64px); /* 减去header高度 */
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}
</style>
