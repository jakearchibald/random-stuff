import type { FunctionalComponent } from 'preact';

import type { BCDSupportStatement } from '../../../../utils/process-bcd';
import { classes } from '../../../../utils/classes';
import ButtonWithPopover from './ButtonWithPopover';
import './styles.css';

export interface Props {
  data: BCDSupportStatement;
}

const CellContent: FunctionalComponent<{ data: BCDSupportStatement }> = ({
  data,
}) => (
  <div>
    {data.supported}
    {data.flagged && (
      <>
        {' '}
        <span title="Behind a flag">🚩</span>
      </>
    )}
    {data.partial && (
      <>
        {' '}
        <span title="Partial implementation">🌓</span>
      </>
    )}
    {data.notes.length > 0 && (
      <>
        {' '}
        <span title="Has notes">📝</span>
      </>
    )}
    {data.links.length > 0 && (
      <>
        {' '}
        <span title="Has links">🔗</span>
      </>
    )}
  </div>
);

const SupportBlock: FunctionalComponent<Props> = ({ data }) => {
  const hasMoreDetails =
    data.flagged ||
    data.partial ||
    data.notes.length > 0 ||
    data.links.length > 0;

  return (
    <td
      class={classes({
        'data-row-support-item': true,
        supported: Boolean(data.supported),
        flagged: Boolean(data.flagged),
        partial: Boolean(data.partial),
      })}
    >
      {hasMoreDetails ? (
        <ButtonWithPopover
          buttonClass="data-row-details-button"
          buttonChildren={<CellContent data={data} />}
        >
          <div class="data-row-popover">
            {(data.partial || data.flagged) && (
              <p class="data-row-details-meta">
                {[
                  data.partial && '🌓 partial implementation',
                  data.flagged && '🚩 behind a flag',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {data.notes.length > 0 && (
              <>
                <h2>📝 Notes</h2>
                <ul>
                  {data.notes.map((note) => (
                    <li dangerouslySetInnerHTML={{ __html: note }} />
                  ))}
                </ul>
              </>
            )}
            {data.links.length > 0 && (
              <>
                <h2>🔗 Links</h2>
                <ul>
                  {data.links.map((link, i) => (
                    <li key={i}>
                      <a href={link}>{link}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </ButtonWithPopover>
      ) : (
        <div>
          <CellContent data={data} />
        </div>
      )}
    </td>
  );
};

export default SupportBlock;
