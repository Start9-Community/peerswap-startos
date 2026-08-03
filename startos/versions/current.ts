import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '5.0.4:1',
  releaseNotes: {
    en_US:
      'Connects to LND and Elements over the StartOS internal bridge instead of the retired hostname form, which is what the mounted TLS certificate actually covers. Fixes the Swap Status action, which passed an option pscli does not accept and so never returned anything. Pins the peerswapd build to the revision the web UI is built against. Rebuilt on start-sdk 2.0.',
    es_ES:
      'Se conecta a LND y Elements a través del puente interno de StartOS en lugar del formato de nombre de host retirado, que es lo que cubre realmente el certificado TLS montado. Corrige la acción Estado de los swaps, que pasaba una opción que pscli no acepta y por tanto nunca devolvía nada. Fija la compilación de peerswapd a la revisión con la que se construye la interfaz web. Reconstruido sobre start-sdk 2.0.',
    de_DE:
      'Verbindet sich mit LND und Elements über die interne StartOS-Bridge statt über die ausgemusterte Hostnamen-Form — nur Erstere deckt das eingebundene TLS-Zertifikat tatsächlich ab. Behebt die Aktion Swap-Status, die eine von pscli nicht akzeptierte Option übergab und daher nie etwas zurückgab. Fixiert den peerswapd-Build auf die Revision, gegen die die Weboberfläche gebaut wird. Neu gebaut auf start-sdk 2.0.',
    pl_PL:
      'Łączy się z LND i Elements przez wewnętrzny mostek StartOS zamiast wycofanej formy nazwy hosta — to właśnie ją obejmuje zamontowany certyfikat TLS. Naprawia akcję Status swapów, która przekazywała opcję nieobsługiwaną przez pscli i przez to nigdy nic nie zwracała. Przypina kompilację peerswapd do rewizji, względem której budowany jest interfejs webowy. Przebudowane na start-sdk 2.0.',
    fr_FR:
      "Se connecte à LND et Elements via le pont interne de StartOS plutôt que par la forme de nom d'hôte retirée, qui est ce que le certificat TLS monté couvre réellement. Corrige l'action État des swaps, qui passait une option que pscli n'accepte pas et ne renvoyait donc jamais rien. Fige la compilation de peerswapd sur la révision contre laquelle l'interface web est construite. Reconstruit sur start-sdk 2.0.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
