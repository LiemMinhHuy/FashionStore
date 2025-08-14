import { useEffect, useState, useRef } from 'react';
import { faCircleXmark, faSpinner, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HeadlessTippy from '@tippyjs/react/headless';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';

import * as searchServices from '~/api/searchService';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import { useDebounce } from '~/hooks';
import styles from './Search.module.scss';

const cx = classNames.bind(styles);

function Search() {
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const debouncedValue = useDebounce(searchValue, 800);
  const inputRef = useRef();

  useEffect(() => {
    if (!debouncedValue.trim()) {
      setSearchResult([]);
      return;
    }

    const fetchApi = async () => {
      setLoading(true);
      try {
        const result = await searchServices.search(debouncedValue);
        setSearchResult(Array.isArray(result.results) ? result.results : []);
      } catch (error) {
        setSearchResult([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApi();
  }, [debouncedValue]);

  const handleClear = () => {
    setSearchValue('');
    setSearchResult([]);
    inputRef.current.focus();
  };

  const handleHideResult = () => setShowResult(false);

  const handleChange = (e) => {
    const value = e.target.value;
    if (!value.startsWith(' ')) setSearchValue(value);
  };

  return (
    <div>
      <HeadlessTippy
        interactive
        visible={showResult && searchResult.length > 0}
        render={attrs => (
          <div className={cx('search-result')} tabIndex="-1" {...attrs}>
            <PopperWrapper>
              <h4 className={cx('search-title')}>Products</h4>
              {searchResult.length === 0 && !loading && <p>No products found</p>}
              {searchResult.map(result => (
                <Link to={`/products/${result.id}`} className={cx('wrapper')} key={result.id}>
                  <div className={cx('info')}>
                    <h4 className={cx('name')}>
                      <span>{result.name}</span>
                    </h4>
                  </div>
                </Link>
              ))}
            </PopperWrapper>
          </div>
        )}
        onClickOutside={handleHideResult}
      >
        <div className={cx('search')}>
          <input
            ref={inputRef}
            value={searchValue}
            placeholder="Search products"
            spellCheck={false}
            onChange={handleChange}
            onFocus={() => setShowResult(true)}
          />
          {!!searchValue && !loading && (
            <button className={cx('clear')} onClick={handleClear}>
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
          )}
          {loading && <FontAwesomeIcon className={cx('loading')} icon={faSpinner} />}
          <button className={cx('search-btn')} onMouseDown={e => e.preventDefault()}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </HeadlessTippy>
    </div>
  );
}

export default Search;
