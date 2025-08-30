import ImageWithHolds from './ImageWithHolds.vue'

const meta = {
  title: 'Components/ImageWithHolds',
  component: ImageWithHolds,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    viewBox: {
      control: 'text',
      description: 'SVG viewBox attribute for the overlay (required)',
    },
  },
  args: {
    viewBox: '0 0 800 600',
  },
}

export default meta

// Basic example with simple holds
export const Basic = {
  args: {
    viewBox: '0 0 800 600',
  },
  render: (args) => ({
    components: { ImageWithHolds },
    setup() {
      return { args }
    },
    template: `
      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="margin-bottom: 16px;">Basic Example</h2>
        <ImageWithHolds v-bind="args">
          <template #image>
            <img 
              src="/otwarcie_fabryczna_testowy.jpg" 
              alt="Test climbing image"
              style="width: 400px; height: auto; border-radius: 8px;"
            />
          </template>
          <template #overlay>
            <circle cx="200" cy="150" r="20" fill="rgba(255, 0, 0, 0.6)" stroke="red" stroke-width="2" />
            <circle cx="300" cy="200" r="20" fill="rgba(0, 255, 0, 0.6)" stroke="green" stroke-width="2" />
            <circle cx="250" cy="300" r="20" fill="rgba(0, 0, 255, 0.6)" stroke="blue" stroke-width="2" />
          </template>
        </ImageWithHolds>
      </div>
    `,
  }),
}
