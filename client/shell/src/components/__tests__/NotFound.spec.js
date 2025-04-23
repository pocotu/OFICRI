import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFound from '../NotFound.vue'

describe('NotFound.vue', () => {
  it('renders the component correctly', () => {
    const wrapper = mount(NotFound)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toContain('404')
  })
}) 