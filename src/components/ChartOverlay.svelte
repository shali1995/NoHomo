<script>
  // Avatars the app floats over the chart at each trade's price point. All 53
  // are here, visible and hidden, at the transforms and visibility the capture
  // recorded -- so the layer matches the live page exactly.
  /** @type {import("../lib/types").ChartMarker[]} */
  // inlined from chartOverlay.json — no data file, the strings live with the code
  const markers =   [
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": null,
          "src": null,
          "bg": null,
          "eyes": false,
          "count": "1+"
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(69, 254, 130)",
          "eyes": true,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": null,
          "src": null,
          "bg": null,
          "eyes": false,
          "count": "1+"
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": null,
          "src": null,
          "bg": null,
          "eyes": false,
          "count": "1+"
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": null,
          "src": null,
          "bg": null,
          "eyes": false,
          "count": "1+"
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(4, 143, 92)",
          "eyes": true,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(4, 143, 92)",
          "eyes": true,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(255, 111, 233)",
          "eyes": true,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(255, 111, 233)",
          "eyes": true,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(81, 106, 246)",
          "eyes": true,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "",
      "visibility": "hidden",
      "stacked": true,
      "layers": [
        {
          "marginTop": "0px",
          "zIndex": "3",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "2",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": "1",
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null
        },
        {
          "marginTop": "-8px",
          "zIndex": null,
          "src": null,
          "bg": null,
          "eyes": false,
          "count": "1+"
        }
      ]
    },
    {
      "transform": "translate3d(36px, 122.942px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(255, 111, 233)",
          "eyes": true,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(78px, 247.534px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(84px, 204.315px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(255, 111, 233)",
          "eyes": true,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(264px, 332.76px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(294px, 330.362px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(396px, 318.176px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(408px, 332.981px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(510px, 346.059px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(576px, 260.251px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(582px, 270.942px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": "rgb(4, 143, 92)",
          "eyes": true,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(612px, 293.663px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(720px, 297.7px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    },
    {
      "transform": "translate3d(828px, 309.476px, 0px)",
      "visibility": "visible",
      "stacked": false,
      "layers": [
        {
          "src": "/images/nohomo-eyes.png",
          "bg": null,
          "eyes": false,
          "count": null,
          "marginTop": null,
          "zIndex": null
        }
      ]
    }
  ];
</script>

<!--
  Index keys are deliberate in both lists below: a marker's position lives in its
  transform, and the captured data repeats markers and layers byte for byte, so no
  field identifies a row.
-->
{#each markers as marker, i (i)}
  <div
    class="absolute pointer-events-auto top-0 left-0"
    style="visibility: {marker.visibility}; will-change: transform; z-index: 20; transform: {marker.transform};"
  >
    {#if marker.stacked}
      <div class="flex flex-col items-center">
        {#each marker.layers as layer, j (j)}
          {#if layer.count}
            <div>
              <div class="flex items-center justify-center rounded-full bg-bg-secondary border-2 border-bg-primary text-text-secondary text-[10px] transition-shadow duration-150 " style="width: 22px; height: 22px;">
                {layer.count}
              </div>
            </div>
          {:else}
            <div style="margin-top: {layer.marginTop ?? '0px'}; z-index: {layer.zIndex ?? 'auto'};">
              <div class="relative rounded-full border border-bg-primary transition-shadow duration-150 ">
                {#if layer.eyes}
                  <div class="rounded-full flex items-center justify-center shrink-0 object-cover" style="width: 22px; height: 22px; min-width: 22px; min-height: 22px; background-color: {layer.bg};">
                    <img class="w-[70%] h-[70%]" src={layer.src} alt="" />
                  </div>
                {:else}
                  <img class="rounded-full flex items-center justify-center shrink-0 object-cover" src={layer.src} alt="" style="width: 22px; height: 22px; min-width: 22px; min-height: 22px;" />
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="relative rounded-full border border-bg-primary transition-[transform,box-shadow] duration-150 hover:scale-110 active:scale-95 cursor-pointer ">
        {#if marker.layers[0]?.eyes}
          <div class="rounded-full flex items-center justify-center shrink-0 object-cover" style="width: 22px; height: 22px; min-width: 22px; min-height: 22px; background-color: {marker.layers[0].bg};">
            <img class="w-[70%] h-[70%]" src={marker.layers[0].src} alt="" />
          </div>
        {:else}
          <img class="rounded-full flex items-center justify-center shrink-0 object-cover" src={marker.layers[0]?.src} alt="" style="width: 22px; height: 22px; min-width: 22px; min-height: 22px;" />
        {/if}
      </div>
    {/if}
  </div>
{/each}
