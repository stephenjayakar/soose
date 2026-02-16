// Browser-compatible type stubs for Electron APIs
export interface ElectronEvent {
  preventDefault: () => void;
  sender: unknown;
}

export interface IpcRendererEvent extends ElectronEvent {
  senderId: number;
}

export interface MouseUpEvent extends ElectronEvent {
  button: number;
}
