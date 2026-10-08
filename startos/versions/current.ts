import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '7.0.0:0',
  releaseNotes: {
    en_US: `Upgrades to PeerSwap v7.0.0, which fixes two CVEs in Liquid swap handling (upstream is withholding details until node operators have had time to upgrade) and bumps the swap protocol to v7 — both peers must be on a v7 build before they can swap with each other again. Also carries the earlier fix for LND 0.21 removing the deprecated SendToRouteSync RPC, which broke every swap on recent LND versions.

- PeerSwap requires LND 0.21.1-beta:1 or later, and LND is listed as a required dependency.
- Swap Status shows peers and active swaps in multi-line fields you can copy, the Liquid balance in sats, and the Liquid deposit address on its own, with a QR code you can scan.`,
    es_ES: `Actualiza a PeerSwap v7.0.0, que corrige dos CVE en el manejo de swaps de Liquid (el proyecto original no publicará los detalles hasta que los operadores de nodos hayan tenido tiempo de actualizar) y eleva el protocolo de swap a v7 — ambos pares deben ejecutar una versión v7 para volver a intercambiar entre sí. También incluye la corrección anterior para la eliminación en LND 0.21 del RPC obsoleto SendToRouteSync, que rompía todos los swaps en versiones recientes de LND.

- PeerSwap requiere LND 0.21.1-beta:1 o posterior, y LND figura como dependencia obligatoria.
- Estado de los swaps muestra los pares y los swaps activos en campos de varias líneas que puedes copiar, el saldo de Liquid en sats y la dirección de depósito de Liquid por sí sola, con un código QR que puedes escanear.`,
    de_DE: `Aktualisiert auf PeerSwap v7.0.0, das zwei CVEs in der Liquid-Swap-Verarbeitung behebt (Details werden vom Upstream-Projekt erst veröffentlicht, wenn Node-Betreiber genug Zeit zum Aktualisieren hatten) und das Swap-Protokoll auf v7 anhebt — beide Peers müssen auf einem v7-Build laufen, um wieder miteinander tauschen zu können. Enthält außerdem die frühere Korrektur dafür, dass LND 0.21 den veralteten SendToRouteSync-RPC entfernt hat, wodurch auf aktuellen LND-Versionen jeder Swap fehlschlug.

- PeerSwap erfordert LND 0.21.1-beta:1 oder neuer, und LND wird als erforderliche Abhängigkeit aufgeführt.
- Swap-Status zeigt Peers und aktive Swaps in mehrzeiligen Feldern, die du kopieren kannst, das Liquid-Guthaben in Sats und die Liquid-Einzahlungsadresse für sich allein, mit einem scannbaren QR-Code.`,
    pl_PL: `Aktualizuje do PeerSwap v7.0.0, który naprawia dwa CVE w obsłudze swapów Liquid (szczegóły zostaną opublikowane przez projekt źródłowy dopiero, gdy operatorzy węzłów będą mieli czas na aktualizację) i podnosi wersję protokołu swapów do v7 — obaj partnerzy muszą działać na wersji v7, aby móc ponownie wymieniać się między sobą. Zawiera także wcześniejszą poprawkę dla usunięcia w LND 0.21 przestarzałego RPC SendToRouteSync, który psuł każdy swap na najnowszych wersjach LND.

- PeerSwap wymaga LND 0.21.1-beta:1 lub nowszego, a LND jest wymieniony jako wymagana zależność.
- Status swapów pokazuje węzły i aktywne swapy w wielowierszowych polach, które możesz skopiować, saldo Liquid w satach oraz sam adres depozytowy Liquid z kodem QR do zeskanowania.`,
    fr_FR: `Met à niveau vers PeerSwap v7.0.0, qui corrige deux CVE dans la gestion des swaps Liquid (le projet amont ne publiera les détails qu'une fois les opérateurs de nœuds laissés le temps de mettre à jour) et fait passer le protocole de swap à la version 7 — les deux pairs doivent utiliser une version v7 pour pouvoir de nouveau échanger entre eux. Inclut également le correctif précédent pour la suppression, dans LND 0.21, du RPC obsolète SendToRouteSync, qui faisait échouer tous les swaps sur les versions récentes de LND.

- PeerSwap nécessite LND 0.21.1-beta:1 ou une version ultérieure, et LND figure comme dépendance obligatoire.
- L'état des swaps affiche les pairs et les swaps actifs dans des champs multilignes que vous pouvez copier, le solde Liquid en sats et l'adresse de dépôt Liquid seule, avec un code QR à scanner.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
