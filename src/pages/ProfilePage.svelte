<script>
  // The profile page, for one wallet: `/profile/{wallet}`.
  //
  // The header is handed to the body as a snippet because the capture's `@container/profile`
  // wrapper owns both and the responsive rules only fire from that ancestor. The page
  // hands both the variant to draw — your own profile, or somebody else's — and the store
  // in src/lib/api/profile.svelte.js fills them from the trader analytics endpoints.
  //
  // Which variant this is cannot be read off the URL alone: a wallet is yours if it is the
  // one you are signed in with, or one of the wallets the API holds for you, so the store
  // answers that once it has read them.
  import ProfileBody from "../components/profile/ProfileBody.svelte";
  import ProfileHeader from "../components/profile/ProfileHeader.svelte";
  import TransfersHistory from "../components/profile/TransfersHistory.svelte";
  import { isOwnProfile, isProfileLoading, startProfile, stopProfile } from "../lib/api/profile.svelte.js";
  import { isTransfersOpen } from "../lib/api/transfers.svelte.js";

  /** @type {{ wallet: string }} */
  let { wallet } = $props();

  $effect(() => {
    startProfile(wallet);
    return () => stopProfile();
  });

  /**
   * Which profile this is. While the read is still in flight the answer is unknown, and answering
   * "somebody else's" paints a send card to a stranger for that beat — so an unloaded profile is
   * treated as your own until the store says otherwise.
   */
  const variant = $derived(isProfileLoading() || isOwnProfile() ? "own" : "other");
</script>

<ProfileBody {variant}>
  <ProfileHeader {variant} />
</ProfileBody>

{#if isTransfersOpen()}
  <TransfersHistory />
{/if}
