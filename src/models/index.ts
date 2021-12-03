export interface Parameter {
  name: string
  value: string
}

export interface ParameterGroup {
  group: string
  parameters: Parameter[]
}