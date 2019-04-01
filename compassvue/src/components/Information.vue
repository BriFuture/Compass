<template>
<div>
  <div>Heading: {{ heading }}</div>
  <div>Picth: {{ pitch }}</div>
  <div>Roll: {{ roll }}</div>
</div>
</template>

<script>
export default {
  props: {
    data: Object
  },
  computed: {
    heading() {
      if(this.data.heading)
        return this.data.heading.toFixed(2);
      return 0;
    },
    pitch() {
      if(this.data.pitch)
        return this.data.pitch.toFixed(2);
      return 0;
    },
    roll() {
      if(this.data.roll)
        return this.data.roll.toFixed(2);
      return 0;
    }
  }
}
</script>

<style>

</style>
