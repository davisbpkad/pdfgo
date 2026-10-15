<script setup>
defineProps({
  obj: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
});

defineEmits(['start-drag']);
</script>

<template>
  <div
    :style="{ left: `${obj.x * 100}%`, top: `${obj.y * 100}%`, width: `${obj.width * 100}%`, height: `${obj.height * 100}%` }"
    :class="[
      'edit-obj-item absolute cursor-move transition-shadow',
      isSelected ? 'ring-2 ring-black ring-offset-1 z-20' : 'z-10'
    ]"
    @pointerdown="$emit('start-drag', $event, obj, 'move')"
  >
    <div v-if="obj.type === 'text'" class="w-full h-full p-1 bg-white/70 border border-black/40 font-bold overflow-hidden" :style="{ color: obj.color, fontSize: `${obj.fontSize || 12}px` }">
      {{ obj.text }}
    </div>
    <div v-else-if="obj.type === 'whiteout'" class="w-full h-full bg-white border border-gray-300" />
    <div v-else-if="obj.type === 'rect'" class="w-full h-full border-2 border-black" :style="{ backgroundColor: obj.fillColor || 'transparent' }" />
    <div v-else-if="obj.type === 'ellipse'" class="w-full h-full rounded-full border-2 border-black" :style="{ backgroundColor: obj.fillColor || 'transparent' }" />
    <div v-else-if="obj.type === 'line'" class="w-full h-full border-b-2 border-black" />
    <img v-else-if="obj.type === 'image' && obj.dataUrl" :src="obj.dataUrl" class="w-full h-full object-contain pointer-events-none" />

    <!-- Resize handle -->
    <div
      v-if="isSelected"
      class="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-black border border-white cursor-nwse-resize z-30"
      @pointerdown.stop="$emit('start-drag', $event, obj, 'resize')"
    />
  </div>
</template>
