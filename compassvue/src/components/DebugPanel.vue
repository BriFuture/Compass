<template>
  <div>
    <div>Heading
      <b-form-input type="range" id="heading" v-model="heading" min="0" max="360" 
        @change="$emit('valueChanged', {'key': 'heading', 'value': heading})" />
    </div>
    <div>Picth
      <b-form-input type="range" id="pitch" v-model="pitch" min="-90" max="90"
        @change="$emit('valueChanged', {'key': 'pitch', 'value': pitch})"/>
    </div>
    <div>Roll
      <b-form-input type="range" id="roll" v-model="roll" min="0" max="180"
        @change="$emit('valueChanged', {'key': 'roll', 'value': roll})"/>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      heading: 0,
      pitch: 0,
      roll: 0,
    }
  }
}
</script>

<style>

</style>
