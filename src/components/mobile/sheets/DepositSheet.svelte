<!--
  The phone deposit sheet: the network list, then the address that network's wallet receives
  on, with its QR and the copy button. Unlike the withdraw flow this one really is a sheet —
  it covers the app, carries the capture's 36 dp top corners and its drag handle, and its
  content is the capture's own padding (12 top, 48 bottom, 17.1 sides).

  The list is the account's own wallets, not the capture's table of eight networks: a row is
  only here when `/v2/user/wallets` has an address to hand out on that chain, because a row
  that opens an address we cannot produce would be a dead end. The QR encodes the address
  printed under it, and the coin named in the line above — "Deposit USDC to add to your cash
  balance" — is the fiat asset of that wallet, so the sentence and the balance agree.
-->
<script>
  import { getIsLoggedIn } from "../../../lib/auth.svelte.js";
  import { navigate } from "../../../lib/router.js";
  import { accountLoaded, accountWallets } from "../../../lib/api/account.svelte.js";

  /** @type {{ onclose: () => void }} */
  let { onclose } = $props();

  /** The names the app uses for the chains `/v2/user/wallets` keys its wallets by. */
  const CHAIN_LABELS = {
    SOL: "Solana",
    BASE: "Base",
    BSC: "BNB Chain",
    MONAD: "Monad",
    RH: "Robinhood Chain",
    ARC: "Arc",
    ETH: "Ethereum"
  };
  /** The capture's own order, applied to whichever of those chains the account holds. */
  const CHAIN_ORDER = ["SOL", "BASE", "BSC", "MONAD", "RH", "ARC", "ETH"];

  let step = $state("list");
  let chain = $state("");
  /** Whether there is a session at all: a signed-out sheet says so rather than sitting blank. */
  const signedIn = $derived(getIsLoggedIn());

  const wallets = $derived(
    [...accountWallets()].sort((a, b) => {
      const left = CHAIN_ORDER.indexOf(a.chain);
      const right = CHAIN_ORDER.indexOf(b.chain);
      return (left < 0 ? CHAIN_ORDER.length : left) - (right < 0 ? CHAIN_ORDER.length : right);
    })
  );

  const wallet = $derived(wallets.find((held) => held.chain === chain) ?? null);
  const label = $derived(wallet ? (CHAIN_LABELS[wallet.chain] ?? wallet.chain) : "");
  const address = $derived(wallet?.address ?? null);
  /** The USD stablecoin of this wallet: the asset a deposit tops up and the line names. */
  const coin = $derived((wallet?.assets ?? []).find((asset) => asset.isFiat) ?? null);

  /**
   * The QR is drawn from the address it sits under, so the two can never disagree. Its dots
   * are the capture's own near-white on the card rather than on a white plate, and it has no
   * quiet zone, which is how the capture's dots reach the card's padding edge.
   */
  let qr = $state("");
  $effect(() => {
    const target = address;
    if (!target) {
      qr = "";
      return;
    }
    let live = true;
    import("qrcode")
      .then((module) =>
        module.toDataURL(target, {
          width: 200,
          margin: 0,
          color: { dark: "#F7F7F7", light: "#00000000" }
        })
      )
      .then((url) => {
        if (live) qr = url;
      })
      .catch(() => {
        if (live) qr = "";
      });
    return () => {
      live = false;
    };
  });

  /**
   * A deposit lands and the sheet has nothing left to say, so it closes. The wallet's own
   * total is what is watched — it counts every asset, so anything arriving shows up — and the
   * baseline is taken from the first read that lands, never from the empty state before it.
   */
  const watchedTotal = $derived(wallet ? wallet.totalValueUsd : null);
  let baseline = null;

  $effect(() => {
    if (!accountLoaded() || watchedTotal === null || step !== "address") return;
    if (baseline === null) {
      baseline = watchedTotal;
      return;
    }
    if (watchedTotal > baseline) {
      baseline = watchedTotal;
      onclose?.();
    }
  });

  let copied = $state(false);
  let copyTimer = 0;

  function copyAddress() {
    navigator.clipboard?.writeText(address ?? "").catch(() => {});
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 2000);
  }

  function back() {
    if (step === "address") {
      step = "list";
      return;
    }
    onclose?.();
  }

  $effect(() => {
    const onKeydown = (event) => {
      if (event.key === "Escape") back();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });

  $effect(() => () => clearTimeout(copyTimer));
</script>

{#snippet mark(which)}
  <!-- The chain marks the deposit rows carry, kept apart from the repo's `network-*` icons
       because those draw their own rounded plate, and here the mark sits bare on the row. -->
  {#if which === "SOL"}
    <svg viewBox="3.25 4.11 12.74 11.11" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M5.38047 12.5925C5.45709 12.5069 5.56245 12.457 5.67419 12.457H15.8076C15.9928 12.457 16.0854 12.7066 15.9545 12.8527L13.9527 15.0878C13.8761 15.1734 13.7707 15.2233 13.659 15.2233H3.52555C3.34037 15.2233 3.24779 14.9737 3.37869 14.8276L5.38047 12.5925Z"
        fill="currentColor"
      />
      <path
        d="M5.38047 4.24679C5.46029 4.16123 5.56564 4.11133 5.67419 4.11133H15.8076C15.9928 4.11133 16.0854 4.36086 15.9545 4.50701L13.9527 6.7421C13.8761 6.82766 13.7707 6.87756 13.659 6.87756H3.52555C3.34037 6.87756 3.24779 6.62803 3.37869 6.48188L5.38047 4.24679Z"
        fill="currentColor"
      />
      <path
        d="M13.9527 8.3923C13.8761 8.30674 13.7707 8.25684 13.659 8.25684H3.52555C3.34037 8.25684 3.24779 8.50637 3.37869 8.65252L5.38047 10.8876C5.45709 10.9732 5.56245 11.0231 5.67419 11.0231H15.8076C15.9928 11.0231 16.0854 10.7735 15.9545 10.6274L13.9527 8.3923Z"
        fill="currentColor"
      />
    </svg>
  {:else if which === "BASE"}
    <svg viewBox="4.166 4.166 11.667 11.667" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M4.16611 5.08866C4.16611 4.77293 4.16611 4.61516 4.22562 4.49366C4.28259 4.37736 4.37656 4.28339 4.49286 4.22642C4.61427 4.16699 4.77204 4.16699 5.08777 4.16699H14.9111C15.2267 4.16699 15.3847 4.16699 15.5061 4.22651C15.6223 4.28348 15.7163 4.37745 15.7733 4.49375C15.8328 4.61516 15.8328 4.77302 15.8328 5.08875V14.9121C15.8328 15.2277 15.8328 15.3857 15.7733 15.5071C15.7163 15.6233 15.6223 15.7173 15.5061 15.7743C15.3847 15.8337 15.2267 15.8337 14.9111 15.8337H5.08777C4.77204 15.8337 4.61427 15.8337 4.49277 15.7743C4.37647 15.7173 4.2825 15.6233 4.22553 15.5071C4.16602 15.3857 4.16602 15.2277 4.16602 14.9121V5.08866H4.16611Z"
        fill="currentColor"
      />
    </svg>
  {:else if which === "BSC"}
    <svg viewBox="3.4 2.4 13.2 15.2" width="18" height="20" fill="none" aria-hidden="true">
      <path
        d="M6.01905 4.79756L9.99954 2.5L13.98 4.79756L12.5166 5.64634L9.99954 4.19756L7.48247 5.64634L6.01905 4.79756ZM13.98 7.69512L12.5166 6.84634L9.99954 8.29513L7.48247 6.84634L6.01905 7.69512V9.39269L8.53612 10.8414V13.739L9.99954 14.5878L11.463 13.739V10.8414L13.98 9.39269V7.69512ZM13.98 12.2902V10.5927L12.5166 11.4414V13.139L13.98 12.2902ZM15.019 12.8902L12.502 14.339V16.0366L16.4825 13.739V9.14388L15.019 9.99269V12.8902ZM13.5557 6.24634L15.019 7.09512V8.79269L16.4825 7.9439V6.24634L15.019 5.39756L13.5557 6.24634ZM8.53612 14.9537V16.6512L9.99954 17.5L11.463 16.6512V14.9537L9.99954 15.8024L8.53612 14.9537ZM6.01905 12.2902L7.48247 13.139V11.4414L6.01905 10.5927V12.2902ZM8.53612 6.24634L9.99954 7.09512L11.463 6.24634L9.99954 5.39756L8.53612 6.24634ZM4.98001 7.09512L6.44343 6.24634L4.98001 5.39756L3.5166 6.24634V7.9439L4.98001 8.79269V7.09512ZM4.98001 9.99269L3.5166 9.14388V13.739L7.49708 16.0366V14.339L4.98001 12.8902V9.99269Z"
        fill="currentColor"
      />
    </svg>
  {:else if which === "ETH"}
    <svg viewBox="6.84 3.6 10.32 16.8" width="13" height="20" fill="none" aria-hidden="true">
      <path
        d="M11.9611 16.1458L6.84717 13.125L11.9604 20.3333L17.0784 13.125L11.959 16.1458H11.9611ZM12.0388 3.66667L6.92356 12.1549L12.0381 15.1785L17.1527 12.1576L12.0388 3.66667Z"
        fill="currentColor"
      />
    </svg>
  {:else if which === "RH"}
    <svg viewBox="4.4 3.1 10.7 14.2" width="15" height="20" fill="none" aria-hidden="true">
      <path
        transform="translate(2.75 2.8) scale(0.6)"
        d="M2.84 24h.53c.096 0 .192-.048.224-.128C7.591 13.696 11.94 8.656 14.67 5.638c.112-.128.064-.225-.096-.225h-4.88a.55.55 0 0 0-.45.225L5.746 9.972c-.514.642-.642 1.236-.642 2.086v4.43c-1.14 3.194-1.862 5.361-2.392 7.32-.032.125.016.192.129.192M20.447.646c-.754-.802-4.157-.834-5.73-.224a3 3 0 0 0-.786.465 41 41 0 0 0-3.323 3.178c-.112.113-.064.225.097.225h5.409c.497 0 .786.289.786.786v6.1c0 .16.128.208.225.064l3.258-4.254c.53-.69.69-.898.835-1.861.192-1.413.08-3.58-.77-4.479m-6.982 16.18 2.231-3.676a.7.7 0 0 0 .064-.29V6.73c0-.16-.112-.225-.224-.097-3.355 3.74-5.971 7.672-8.395 12.407-.06.12.016.225.16.177l5.009-1.54c.565-.174.882-.402 1.155-.852"
        fill="currentColor"
      />
    </svg>
  {/if}
{/snippet}

<!-- The scrim is the dismiss target and the sheet is its sibling, the way the cash sheet
     does it: one element with one job, and nothing to stop propagating. -->
<div class="overlay">
  <div class="scrim" role="presentation" onclick={() => onclose?.()}></div>
  <div class="sheet" role="dialog" aria-label="Deposit crypto">
    <div class="grabber"></div>

    <header class="head" class:head--address={step === "address"}>
      <button type="button" class="back" aria-label="Back" onclick={back}>
        <svg class="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 5.5 8.6 12l6.4 6.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="head-text">
        <h2 class="head-title">Deposit crypto</h2>
        <p class="head-sub">
          {step === "list" ? "Choose a network to deposit from." : `Send any token on the ${label} network.`}
        </p>
      </div>
    </header>

    {#if step === "list"}
      <div class="list">
        {#each wallets as held (held.chain)}
          <button
            type="button"
            class="net-row"
            onclick={() => {
              chain = held.chain;
              step = "address";
            }}
          >
            <span class="net-label">{CHAIN_LABELS[held.chain] ?? held.chain}</span>
            <span class="net-mark">{@render mark(held.chain)}</span>
          </button>
        {/each}

        {#if wallets.length === 0 && (accountLoaded() || !signedIn)}
          <!-- The capture never opened an account with no wallet, so these lines are the app's:
               there is no row to draw because there is no address to draw it from. Signed out
               is a state of its own — a blank sheet would read as a broken one. -->
          <p class="empty">
            {signedIn
              ? "Your account has no app wallet to deposit to."
              : "Connect a wallet to see your deposit address."}
          </p>
          {#if !signedIn}
            <!-- The phone's own way in: a desktop shows the QR, this page takes the session.
                 Nothing here pretends to hold a key. -->
            <button type="button" class="pair" onclick={() => navigate("/connect")}>
              Scan the QR code
            </button>
          {/if}
        {/if}
      </div>
    {:else}
      <div class="address-step">
        {#if coin}
          <p class="inline">
            <span>Deposit</span>
            <span class="coin">
              <svg viewBox="0 0 16 16" width="24" height="24" fill="none" aria-hidden="true">
                <path
                  d="M8 16C12.4334 16 16 12.4334 16 8C16 3.56664 12.4334 0 8 0C3.56664 0 0 3.56664 0 8C0 12.4334 3.56664 16 8 16Z"
                  fill="#2775CA"
                />
                <path
                  d="M10.2 9.26641C10.2 8.09977 9.50004 7.69977 8.10004 7.53313C7.10004 7.39977 6.90004 7.13313 6.90004 6.66641C6.90004 6.19969 7.2334 5.89977 7.90004 5.89977C8.50004 5.89977 8.8334 6.09977 9.00004 6.59977C9.0334 6.69977 9.1334 6.76641 9.2334 6.76641H9.76668C9.90004 6.76641 10 6.66641 10 6.53313V6.49977C9.86668 5.76641 9.26668 5.19977 8.50004 5.13313V4.33313C8.50004 4.19977 8.40004 4.09977 8.2334 4.06641H7.7334C7.60004 4.06641 7.50004 4.16641 7.46668 4.33313V5.09977C6.46668 5.23313 5.8334 5.89977 5.8334 6.73313C5.8334 7.83313 6.50004 8.26641 7.90004 8.43313C8.8334 8.59977 9.1334 8.79977 9.1334 9.33313C9.1334 9.86649 8.66668 10.2331 8.0334 10.2331C7.16668 10.2331 6.86668 9.86641 6.76668 9.36641C6.7334 9.23313 6.6334 9.16641 6.5334 9.16641H5.96668C5.8334 9.16641 5.7334 9.26641 5.7334 9.39977V9.43313C5.86668 10.2664 6.40004 10.8664 7.50004 11.0331V11.8331C7.50004 11.9664 7.60004 12.0664 7.76668 12.0998H8.26668C8.40004 12.0998 8.50004 11.9998 8.5334 11.8331V11.0331C9.5334 10.8664 10.2 10.1664 10.2 9.26641Z"
                  fill="white"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.33303 6.36629C2.36631 8.93301 3.69967 11.833 6.29967 12.7663C6.39967 12.833 6.49967 12.9663 6.49967 13.0663V13.533C6.49967 13.5996 6.49967 13.633 6.46631 13.6663C6.43303 13.7996 6.29967 13.8663 6.16631 13.7996C4.29967 13.1996 2.86631 11.7663 2.26631 9.89965C1.26631 6.73301 2.99967 3.36629 6.16631 2.36629C6.19967 2.33301 6.26631 2.33301 6.29967 2.33301C6.43303 2.36629 6.49967 2.46629 6.49967 2.59965V3.06629C6.49967 3.23301 6.43303 3.33301 6.29967 3.39965C4.93303 3.89965 3.83303 4.96629 3.33303 6.36629ZM9.53303 2.49965C9.56631 2.36629 9.69967 2.29965 9.83303 2.36629C11.6663 2.96629 13.133 4.39965 13.733 6.29965C14.733 9.46629 12.9997 12.833 9.83303 13.833C9.79967 13.8663 9.73303 13.8663 9.69967 13.8663C9.56631 13.833 9.49967 13.733 9.49967 13.5996V13.133C9.49967 12.9663 9.56631 12.8663 9.69967 12.7996C11.0663 12.2996 12.1663 11.233 12.6663 9.83301C13.633 7.26629 12.2997 4.36629 9.69967 3.43301C9.59967 3.36629 9.49967 3.23301 9.49967 3.09965V2.63301C9.49967 2.56629 9.49967 2.53301 9.53303 2.49965Z"
                  fill="white"
                />
              </svg>
            </span>
            <span>{coin.token?.symbol ?? "USD"} to add to your cash balance.</span>
          </p>
        {/if}

        <div class="qr-card">
          {#if qr}
            <img src={qr} alt="Deposit address QR code" />
          {/if}
        </div>

        {#if address}
          <p class="address" title={address}>{address}</p>
        {/if}

        {#if address}
          <!-- The capture holds only this button's resting state; the tick is the same
               acknowledgement the desktop sheet draws, for the same two seconds. -->
          <button type="button" class="copy" onclick={copyAddress}>
            {#if copied}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path
                  d="m8.5 12.2 2.4 2.4 4.6-4.8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="8" y="8" width="14" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" />
                <path
                  d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {/if}
            <span>Copy wallet address</span>
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Over the app and over its floating nav bar (which keeps z-index 30): the capture's sheet
     covers the bar, not the other way round. */
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: flex-end;
  }

  /* The one way in on a phone that is not already inside a wallet's browser. */
  .pair {
    align-self: center;
    margin-top: 4px;
    padding: 12px 20px;
    border-radius: 12px;
    background: var(--m-blue);
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .scrim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  /* The capture's sheet: opaque page colour, its top corners rounded 36, its drag handle 17 dp
     below the top edge, and the 48 dp of clearance the bottom of its content keeps. */
  .sheet {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 100%;
    padding: 12px 17.1px 48px;
    border-radius: 36px 36px 0 0;
    background: var(--m-bg);
    color: var(--m-text);
  }

  .grabber {
    flex: 0 0 auto;
    width: 36px;
    height: 5px;
    margin: 5px auto 0;
    border-radius: 2.5px;
    background: var(--m-hairline);
  }

  /* Title over subtitle, centred on the sheet, with the back chevron over the left corner.
     The capture centres that text block 4.25 dp right of the sheet's own centre, and its
     chevron sits 2.65 dp above the middle of the title's line. */
  .head {
    position: relative;
    flex: 0 0 auto;
    margin-top: 19.2px;
  }

  .head-text {
    display: flex;
    flex-direction: column;
    gap: 6.9px;
    padding-left: 8.5px;
  }

  /* The address state's caption sits lower under the same title in the capture. */
  .head--address .head-text {
    gap: 15.5px;
  }

  .back {
    position: absolute;
    top: -9.7px;
    left: -4.75px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }

  .chev {
    width: 22px;
    height: 22px;
    color: var(--m-muted);
    opacity: 0.35;
  }

  .head-title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    text-align: center;
  }

  .head-sub {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    text-align: center;
    color: var(--m-muted);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 21.9px;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .list::-webkit-scrollbar {
    display: none;
  }

  .net-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex: 0 0 auto;
    height: 56px;
    padding: 16px;
    border-radius: 12px;
    background: var(--m-card);
  }

  .net-label {
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    text-align: left;
  }

  .net-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    color: var(--m-text);
  }

  .empty {
    margin: 0;
    padding: 4px 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--m-muted);
  }

  .address-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .address-step::-webkit-scrollbar {
    display: none;
  }

  .inline {
    display: flex;
    align-items: center;
    gap: 5.8px;
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--m-muted);
  }

  .coin {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }

  .qr-card {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 232px;
    height: 232px;
    margin-top: 24.3px;
    padding: 16px;
    border: 1px solid var(--m-hairline);
    border-radius: 20px;
    background: var(--m-card-2);
  }

  .qr-card img {
    display: block;
    width: 198.4px;
    height: 198.4px;
  }

  .address {
    width: 397.9px;
    max-width: 100%;
    margin: 24px 0 0;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    text-align: center;
    overflow-wrap: anywhere;
    color: var(--m-muted);
  }

  /* The capture's copy button: a one dp `#2e2d41 -> #161522` ring around the card's fill. */
  .copy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 0 0 auto;
    width: 210.1px;
    height: 48px;
    margin-top: 24px;
    border: 1px solid transparent;
    border-radius: 12px;
    background:
      linear-gradient(var(--m-card-2), var(--m-card-2)) padding-box,
      linear-gradient(90deg, #2e2d41, #161522) border-box;
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .copy svg {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
  }
</style>
