import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo'); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== 'undefined') {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };
  return (
    <div>
      <Header />
      <main className='taskList'>
        <p className='error-message'>{errorMessage}</p>
        <div>
          <div className='list-header'>
            <h2>リスト一覧</h2>
            <div className='list-menu'>
              <p>
                <Link to='/list/new'>リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className='list-tab'>
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectList(list.id)}
                  tabIndex='0'
                  role='button'
                  aria-selected={isActive}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSelectList(list.id);
                    }
                  }}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className='tasks'>
            <div className='tasks-header'>
              <h2>タスク一覧</h2>
              <Link to='/task/new'>タスク新規作成</Link>
            </div>
            <div className='display-select-wrapper'>
              <select
                onChange={handleIsDoneDisplayChange}
                className='display-select'
              >
                <option value='todo'>未完了</option>
                <option value='done'>完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay == 'done') {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => {
            const limit = task.limit && new Date(task.limit.slice(0, -1));

            const limitString =
              limit &&
              limit.toLocaleString('ja-JP', {
                timeZone: 'Asia/Tokyo',
              });

            return (
              <li key={key} className='task-item'>
                <Link
                  to={`/lists/${selectListId}/tasks/${task.id}`}
                  className='task-item-link'
                >
                  {task.title}
                  <br />
                  期限: {limitString ? limitString : '未設定'}
                  <br />
                  {task.done ? '完了' : '未完了'}
                </Link>
              </li>
            );
          })}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => {
          const limit = task.limit
            ? new Date(task.limit.slice(0, -1))
            : undefined;

          const limitString = limit
            ? limit.toLocaleString('ja-JP', {
                timeZone: 'Asia/Tokyo',
              })
            : undefined;

          const now = new Date();

          const diffMs = limit ? limit - now : undefined;

          const isDead = limit ? diffMs < 0 : undefined;

          const diffSec = Math.floor(diffMs / 1000);
          const days = Math.floor(diffSec / (24 * 3600));
          const hours = Math.floor((diffSec % (24 * 3600)) / 3600);
          const minutes = Math.floor((diffSec % 3600) / 60);

          return (
            <li key={key} className='task-item'>
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className='task-item-link'
              >
                {task.title}
                <br />
                期限:{' '}
                {limit
                  ? limitString +
                    (isDead
                      ? ' - 期限が過ぎています'
                      : ` - あと${days}日${hours}時間${minutes}分`)
                  : '未設定'}
                <br />
                {task.done ? '完了' : '未完了'}
              </Link>
            </li>
          );
        })}
    </ul>
  );
};
