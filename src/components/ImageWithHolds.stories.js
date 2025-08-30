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
      description: 'SVG viewBox attribute for the overlay',
    },
    autoDetectViewBox: {
      control: 'boolean',
      description: 'Automatically detect viewBox from image dimensions',
    },
  },
  args: {
    viewBox: '0 0 800 600',
    autoDetectViewBox: false,
  },
}

export default meta

// Basic example with simple holds
export const Basic = {
  args: {
    viewBox: '0 0 800 600',
    autoDetectViewBox: false,
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

// Auto-detect viewBox example
export const AutoDetectViewBox = {
  args: {
    autoDetectViewBox: true,
  },
  render: (args) => ({
    components: { ImageWithHolds },
    setup() {
      return { args }
    },
    template: `
      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="margin-bottom: 16px;">Auto-detect ViewBox</h2>
        <p style="margin-bottom: 16px; color: #666;">
          ViewBox is automatically detected from image dimensions
        </p>
        <ImageWithHolds v-bind="args">
          <template #image>
            <img 
              src="/otwarcie_fabryczna_testowy.jpg" 
              alt="Test climbing image"
              style="width: 400px; height: auto; border-radius: 8px;"
            />
          </template>
          <template #overlay>
            <circle cx="400" cy="300" r="30" fill="rgba(255, 165, 0, 0.6)" stroke="orange" stroke-width="3" />
            <circle cx="600" cy="400" r="25" fill="rgba(255, 0, 255, 0.6)" stroke="magenta" stroke-width="3" />
            <circle cx="500" cy="500" r="35" fill="rgba(0, 255, 255, 0.6)" stroke="cyan" stroke-width="3" />
          </template>
        </ImageWithHolds>
      </div>
    `,
  }),
}

// Complex shapes example
export const ComplexShapes = {
  args: {
    viewBox: '0 0 800 600',
    autoDetectViewBox: false,
  },
  render: (args) => ({
    components: { ImageWithHolds },
    setup() {
      return { args }
    },
    template: `
      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="margin-bottom: 16px;">Complex Hold Shapes</h2>
        <p style="margin-bottom: 16px; color: #666;">
          Different SVG shapes for different hold types
        </p>
        <ImageWithHolds v-bind="args">
          <template #image>
            <img 
              src="/otwarcie_fabryczna_testowy.jpg" 
              alt="Test climbing image"
              style="width: 400px; height: auto; border-radius: 8px;"
            />
          </template>
          <template #overlay>
            <!-- Start hold (polygon) -->
            <polygon 
              points="100,450 150,430 180,460 150,490 100,480" 
              fill="rgba(0, 255, 0, 0.7)" 
              stroke="green" 
              stroke-width="3" 
            />
            <!-- Intermediate holds (ellipses) -->
            <ellipse cx="250" cy="350" rx="25" ry="15" fill="rgba(255, 255, 0, 0.6)" stroke="gold" stroke-width="2" />
            <ellipse cx="350" cy="250" rx="20" ry="30" fill="rgba(255, 255, 0, 0.6)" stroke="gold" stroke-width="2" />
            <!-- Finish hold (rectangle) -->
            <rect 
              x="420" y="80" width="60" height="40" 
              fill="rgba(255, 0, 0, 0.7)" 
              stroke="red" 
              stroke-width="3" 
              rx="5"
            />
            <!-- Route line -->
            <path 
              d="M 125,465 Q 250,350 350,250 Q 400,150 450,100" 
              stroke="rgba(255, 255, 255, 0.8)" 
              stroke-width="3" 
              fill="none" 
              stroke-dasharray="5,5"
            />
          </template>
        </ImageWithHolds>
      </div>
    `,
  }),
}

// Responsive example
export const Responsive = {
  args: {
    autoDetectViewBox: true,
  },
  render: (args) => ({
    components: { ImageWithHolds },
    setup() {
      return { args }
    },
    template: `
      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="margin-bottom: 16px;">Responsive Example</h2>
        <p style="margin-bottom: 16px; color: #666;">
          Image and overlay scale together responsively
        </p>
        <ImageWithHolds v-bind="args">
          <template #image>
            <img 
              src="/otwarcie_fabryczna_testowy.jpg" 
              alt="Test climbing image"
              style="width: 100%; max-width: 600px; height: auto; border-radius: 8px;"
            />
          </template>
          <template #overlay>
            <circle cx="200" cy="200" r="20" fill="rgba(255, 0, 0, 0.6)" stroke="red" stroke-width="2" />
            <circle cx="400" cy="300" r="20" fill="rgba(0, 255, 0, 0.6)" stroke="green" stroke-width="2" />
            <circle cx="600" cy="400" r="20" fill="rgba(0, 0, 255, 0.6)" stroke="blue" stroke-width="2" />
          </template>
        </ImageWithHolds>
      </div>
    `,
  }),
}

// Minimal example - just slots
export const SlotsOnly = {
  args: {
    viewBox: '0 0 100 100',
  },
  render: (args) => ({
    components: { ImageWithHolds },
    setup() {
      return { args }
    },
    template: `
      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="margin-bottom: 16px;">Pure Slots Example</h2>
        <p style="margin-bottom: 16px; color: #666;">
          Simple demonstration of the slot-based API
        </p>
        <ImageWithHolds v-bind="args">
          <template #image>
            <div style="width: 200px; height: 150px; background: linear-gradient(45deg, #4f46e5, #06b6d4); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              Demo Image
            </div>
          </template>
          <template #overlay>
            <circle cx="50" cy="25" r="8" fill="rgba(255, 255, 255, 0.8)" stroke="white" stroke-width="1" />
            <circle cx="75" cy="75" r="6" fill="rgba(255, 255, 0, 0.8)" stroke="gold" stroke-width="1" />
          </template>
        </ImageWithHolds>
      </div>
    `,
  }),
}
