import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '5.0.4:2',
  releaseNotes: {
    en_US:
      'Restores two actions that were built but never reachable. Swap Status — your PeerSwap peers, active swaps, and Liquid balance and deposit address — and Set Local Mempool URL, which points the web interface at your own block explorer for transaction links, are both available again under Actions.',
    es_ES:
      'Restaura dos acciones que estaban implementadas pero nunca eran accesibles. Estado de los swaps —tus pares de PeerSwap, los swaps activos y el saldo y la dirección de depósito de Liquid— y Definir URL de mempool local, que apunta la interfaz web a tu propio explorador de bloques para los enlaces de transacciones, vuelven a estar disponibles en Acciones.',
    de_DE:
      'Stellt zwei Aktionen wieder her, die zwar gebaut, aber nie erreichbar waren. Swap-Status — Ihre PeerSwap-Peers, aktive Swaps sowie Liquid-Guthaben und Einzahlungsadresse — und Lokale Mempool-URL festlegen, womit die Weboberfläche für Transaktionslinks auf Ihren eigenen Block-Explorer verweist, sind unter Aktionen wieder verfügbar.',
    pl_PL:
      'Przywraca dwie akcje, które zostały zbudowane, ale nigdy nie były dostępne. Status swapów — Twoje węzły PeerSwap, aktywne swapy oraz saldo i adres depozytowy Liquid — oraz Ustaw lokalny adres mempool, który kieruje interfejs webowy do Twojego własnego eksploratora bloków dla odnośników do transakcji, znów są dostępne w sekcji Akcje.',
    fr_FR:
      "Rétablit deux actions qui étaient développées mais inaccessibles. État des swaps — vos pairs PeerSwap, les swaps actifs, ainsi que le solde Liquid et son adresse de dépôt — et Définir l'URL du mempool local, qui oriente l'interface web vers votre propre explorateur de blocs pour les liens de transactions, sont de nouveau disponibles sous Actions.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
