<ul class="dice-weight-legend" aria-label="六面概率图例">
  <li><span class="dice-weight-legend__swatch dice-weight-legend__swatch--boost"></span>高概率</li>
  <li><span class="dice-weight-legend__swatch dice-weight-legend__swatch--normal"></span>常态</li>
  <li><span class="dice-weight-legend__swatch dice-weight-legend__swatch--weak"></span>低概率</li>
  <li><span class="dice-weight-legend__swatch dice-weight-legend__swatch--blocked"></span>无法掷出</li>
</ul>

<style>
  .dice-weight-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2) var(--space-3);
    list-style: none;
    margin: 0;
    padding: var(--space-2) var(--space-3);
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(201, 168, 106, 0.2);
    border-radius: var(--radius-card);
    font-size: 0.6875rem;
    color: var(--color-text-soft);
  }

  .dice-weight-legend li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dice-weight-legend__swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid #2d1e15;
    flex-shrink: 0;
  }

  .dice-weight-legend__swatch--boost {
    background: #dfd5c0;
    box-shadow: inset 0 0 0 1px #a63a2b;
  }

  .dice-weight-legend__swatch--normal {
    background: #eae6db;
  }

  .dice-weight-legend__swatch--weak {
    background: #ece9e0;
    opacity: 0.55;
  }

  .dice-weight-legend__swatch--blocked {
    background: #e0ddd4;
    opacity: 0.35;
    position: relative;
  }

  .dice-weight-legend__swatch--blocked::after {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    top: 50%;
    height: 1px;
    background: #2b1f13;
    transform: rotate(-35deg);
  }
</style>
