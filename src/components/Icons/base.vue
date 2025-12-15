<script lang="ts">
import { uicolors } from 'src/utils/colors';

export default {
  name: 'IconBase',
  props: {
    active: Boolean,
    darkMode: { type: Boolean, default: false },
  },
  computed: {
    lightColor(): string {
      // Use blue tones to match sidebar background
      const activeBlue = this.darkMode
        ? uicolors.blue['400']
        : uicolors.blue['700'];
      const passiveBlue = this.darkMode
        ? uicolors.blue['500']
        : uicolors.blue['500'];
      return this.active ? activeBlue : passiveBlue;
    },
    darkColor(): string {
      // Use darker blue tones for contrast
      const activeBlue = this.darkMode
        ? uicolors.blue['300']
        : uicolors.blue['900'];
      const passiveBlue = this.darkMode
        ? uicolors.blue['400']
        : uicolors.blue['700'];
      return this.active ? activeBlue : passiveBlue;
    },
    bgColor(): string {
      return this.darkMode ? uicolors.blue['900'] : uicolors.blue['50'];
    },
  },
};
</script>
