<template>
  <div class="user-profile-skeleton">
    <!-- Header Skeleton -->
    <div class="header">
      <div class="avatar-skeleton"></div>
      <div class="info">
        <div class="name-skeleton"></div>
        <div class="details-skeleton"></div>
      </div>
    </div>

    <!-- Tabs Skeleton -->
    <div class="tabs-skeleton">
      <div class="tab-skeleton"></div>
      <div class="tab-skeleton"></div>
    </div>

    <!-- Content Skeleton -->
    <div class="content-skeleton">
      <div class="section-skeleton">
        <div class="title-skeleton"></div>
        <div class="item-skeleton"></div>
        <div class="item-skeleton"></div>
        <div class="item-skeleton"></div>
      </div>
      <div class="section-skeleton">
        <div class="title-skeleton"></div>
        <div class="item-skeleton"></div>
        <div class="item-skeleton"></div>
        <div class="item-skeleton"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props or logic needed for skeleton component
</script>

<style scoped>
.user-profile-skeleton {
  padding: var(--spacing-lg);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.avatar-skeleton {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-gray-100);
  animation: pulse 1.5s infinite;
}

.info {
  flex: 1;
}

.name-skeleton {
  width: 200px;
  height: 24px;
  background: var(--color-gray-100);
  margin-bottom: var(--spacing-sm);
  animation: pulse 1.5s infinite;
}

.details-skeleton {
  width: 300px;
  height: 16px;
  background: var(--color-gray-100);
  animation: pulse 1.5s infinite;
}

.tabs-skeleton {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.tab-skeleton {
  width: 120px;
  height: 32px;
  background: var(--color-gray-100);
  animation: pulse 1.5s infinite;
}

.content-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.title-skeleton {
  width: 150px;
  height: 20px;
  background: var(--color-gray-100);
  animation: pulse 1.5s infinite;
}

.item-skeleton {
  width: 100%;
  height: 16px;
  background: var(--color-gray-100);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}
</style> 