<!--
  The "Add thesis" row that sits under the position card: a dotted-circle plus and a blue
  label, in a 56 dp band that starts at x 8.

  This build has no thesis composer for it to open — the phone shell owns the sheets and none
  of them writes a thesis — so the row holds the capture's place and is not pressable.
-->
<button type="button" class="row" disabled>
  <span class="icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10.2" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.4 3.2" />
      <path d="M12 8.4v7.2M8.4 12h7.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    </svg>
  </span>
  <span class="label">Add thesis</span>
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 56px;
    padding: 16px 8px;
    text-align: left;
    cursor: default;
  }

  .icon {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--m-blue);
  }

  .icon svg {
    width: 24px;
    height: 24px;
  }

  .label {
    font-size: 14px;
    font-weight: 700;
    line-height: 16.8px;
    color: var(--m-blue);
  }
</style>
