import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '7.0.0:0',
  releaseNotes: {
    en_US:
      'Upgrades to PeerSwap v7.0.0, which fixes two CVEs in Liquid swap handling (upstream is withholding details until node operators have had time to upgrade) and bumps the swap protocol to v7 — both peers must be on a v7 build before they can swap with each other again. Also carries the earlier fix for LND 0.21 removing the deprecated SendToRouteSync RPC, which broke every swap on recent LND versions.',
    es_ES:
      'Actualiza a PeerSwap v7.0.0, que corrige dos CVE en el manejo de swaps de Liquid (el proyecto original no publicará los detalles hasta que los operadores de nodos hayan tenido tiempo de actualizar) y eleva el protocolo de swap a v7 — ambos pares deben ejecutar una versión v7 para volver a intercambiar entre sí. También incluye la corrección anterior para la eliminación en LND 0.21 del RPC obsoleto SendToRouteSync, que rompía todos los swaps en versiones recientes de LND.',
    de_DE:
      'Aktualisiert auf PeerSwap v7.0.0, das zwei CVEs in der Liquid-Swap-Verarbeitung behebt (Details werden vom Upstream-Projekt erst veröffentlicht, wenn Node-Betreiber genug Zeit zum Aktualisieren hatten) und das Swap-Protokoll auf v7 anhebt — beide Peers müssen auf einem v7-Build laufen, um wieder miteinander tauschen zu können. Enthält außerdem die frühere Korrektur dafür, dass LND 0.21 den veralteten SendToRouteSync-RPC entfernt hat, wodurch auf aktuellen LND-Versionen jeder Swap fehlschlug.',
    pl_PL:
      'Aktualizuje do PeerSwap v7.0.0, który naprawia dwa CVE w obsłudze swapów Liquid (szczegóły zostaną opublikowane przez projekt źródłowy dopiero, gdy operatorzy węzłów będą mieli czas na aktualizację) i podnosi wersję protokołu swapów do v7 — obaj partnerzy muszą działać na wersji v7, aby móc ponownie wymieniać się między sobą. Zawiera także wcześniejszą poprawkę dla usunięcia w LND 0.21 przestarzałego RPC SendToRouteSync, który psuł każdy swap na najnowszych wersjach LND.',
    fr_FR:
      "Met à niveau vers PeerSwap v7.0.0, qui corrige deux CVE dans la gestion des swaps Liquid (le projet amont ne publiera les détails qu'une fois les opérateurs de nœuds laissés le temps de mettre à jour) et fait passer le protocole de swap à la version 7 — les deux pairs doivent utiliser une version v7 pour pouvoir de nouveau échanger entre eux. Inclut également le correctif précédent pour la suppression, dans LND 0.21, du RPC obsolète SendToRouteSync, qui faisait échouer tous les swaps sur les versions récentes de LND.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
