// Interactions that wait for the UI the way a person does.
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { expect } from 'vitest'

// Clicks the control with this data-testid once it is enabled: a workbench
// disables its controls while an operation runs, and a person cannot click a
// disabled button either.
export async function pressWhenEnabled(testId) {
  const button = await screen.findByTestId(testId)
  await waitFor(() => expect(button.disabled).toBe(false))
  await fireEvent.click(button)
}
