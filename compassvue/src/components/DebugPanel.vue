<template>
  <div>
    <div>Heading: {{heading}}
      <b-form-input type="range" id="heading" :value="data.heading" min="0" max="360" 
        @change="$emit('valueChanged', {'key': 'heading', 'value': $event})" />
    </div>
    <div>Picth: {{data.pitch.toFixed(2)}}
      <b-form-input type="range" id="pitch" :value="data.pitch" min="-90" max="90"
        @change="$emit('valueChanged', {'key': 'pitch', 'value': $event})"/>
    </div>
    <div>Roll: {{data.roll.toFixed(2)}}
      <b-form-input type="range" id="roll" :value="data.roll" min="0" max="180"
        @change="$emit('valueChanged', {'key': 'roll', 'value': $event})"/>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: Object,
  },
  computed: {
    heading() {
      return this.data.heading.toFixed(2)
    }
  }
  // data() {
  //   return {
  //     heading: 0,
  //     pitch: 0,
  //     roll: 0,
  //   }
  // }
}
</script>

<style>

</style>
