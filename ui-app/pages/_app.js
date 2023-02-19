import '../styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'semantic-ui-css/semantic.min.css'

import {Provider} from 'react-redux';
import wrapper from '../store/store-wrapper'

const MyApp = ({Component, ...rest}) => {
  const {store, props} = wrapper.useWrappedStore(rest);
  return (
      <Provider store={store}>
        <Component {...props.pageProps} />
      </Provider>
  );
};

export default wrapper.withRedux(MyApp);