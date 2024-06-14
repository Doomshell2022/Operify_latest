import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Modal,
  Alert,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
  Linking,
  SafeAreaView,
} from 'react-native';
import React, {Component} from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Table, Row} from 'react-native-table-component';
import {BASE_URL, makeRequest} from '../../api/Api_info';
import CustomLoader from '../../Component/loader/Loader';
import ProcessingLoader from '../../Component/loader/ProcessingLoader';
import { KEYS, getData } from '../../api/User_Preference';
// Import your logo image
import logo from '../../Assets/applogo.png';
export class Production extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tableHead: [
        'Id',
        'Date',
        'Contract Name',
        'Product',
        'Plan Qty',
        'Prep Qty',
      ],
      rowData: [],
      currentPage: 0,
      rowsPerPage: 50,
      searchName: '',
      contractName: [],
      showProcessingLoader: false,
      isRefreshing: false,
      isLoading: false,
      errorMessage: '',
      contractId: '',
      productionId: '',
      logoSource: null,
    };
  }

  async componentDidMount() {
    this.handleProduction();
    try {
      const info = await getData(KEYS.USER_INFO);
      if (info && info.logo) {
          console.log('Using fetched logo:', info.logo);
          this.setState({ logoSource: { uri: info.logo } });
        } else {
          console.log('Using default logo');
          this.setState({ logoSource: logo });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        console.log('Using default logo due to error');
        this.setState({ logoSource: logo });
      }
  }

  handleProduction = async () => {
    try {
      this.setState({showProcessingLoader: true, isRefreshing: true});
      const erpiD = await getData(KEYS.USER_INFO);
      console.log('efeeeee', erpiD.erpID);
  
      const params = { erpID: erpiD.erpID };
      const response = await makeRequest(BASE_URL + '/mobile/production',params);
      const {success, message, productionDetails} = response;
      // console.log("production",response);
      if (success) {
        const modifiedProductionDetails = productionDetails.map(
          ({
            po_id,
            date,
            contact_name,
            product,
            plannedqty,
            preparedqty,
            contract_id,
          }) => ({
            po_id,
            date,
            contact_name,
            product,
            plannedqty,
            preparedqty,
            contract_id,
          }),
        ); // changes by manish
        this.setState({
          rowData: modifiedProductionDetails,
          showProcessingLoader: false,
          isRefreshing: false,
        }); // chnages by manish
      } else {
        console.log(message);
        this.setState({showProcessingLoader: false, isRefreshing: false});
      }
    } catch (error) {
      console.log(error);
      this.setState({showProcessingLoader: false, isRefreshing: false});
    }
  };

  // pdf api by manish
  handlePressProductID = productionId => {
    this.setState({productionId}, this._handlePressProductpdf); // Pass a reference to _handlePressProductpdf
  };

  _handlePressProductpdf = async () => {
    try {
      const erpiD = await getData(KEYS.USER_INFO);
      console.log('efeeeee', erpiD.erpID);
      const {productionId} = this.state;
      if (!productionId) {
        console.log('No contract ID available to fetch PDF');
        return;
      }
      const params = {production_id: productionId,erpID: erpiD.erpID};
      console.log('papapapapapap', params);
      const response = await makeRequest(
        BASE_URL + '/mobile/productionorderpdf',
        params,
      );
      const {success, message, pdfLink} = response;
      console.log('pdfpdfpdf', response);
      if (success) {
        console.log('PDF Link:', pdfLink);
        Linking.openURL(pdfLink);
      } else {
        console.log('====================================');
        console.log(message);
        console.log('====================================');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // pdf api by manish

  handlePressContract = contractId => {
    this.setState({contractId}, this._handleContractPdf);
  };

  _handleContractPdf = async () => {
    try {
      const erpiD = await getData(KEYS.USER_INFO);
      console.log('efeeeee', erpiD.erpID);
      const {contractId} = this.state;
      if (!contractId) {
        console.log('No contract ID available to fetch PDF');
        return;
      }

      const params = {contract_id: contractId,erpID: erpiD.erpID};
      const response = await makeRequest(
        BASE_URL + '/mobile/contractpdf',
        params,
      );
      const {success, message, pdfLink} = response;
      console.log('PDF response:', response);
      if (success) {
        console.log('PDF Link:', pdfLink);
        // Handle PDF link as needed, e.g., opening it
        Linking.openURL(pdfLink);
      } else {
        console.log('Error fetching PDF:', message);
      }
    } catch (error) {
      console.log('Error fetching PDF:', error);
    }
  };

  nextPage = () => {
    const {currentPage} = this.state;
    this.setState({currentPage: currentPage + 1});
  };

  prevPage = () => {
    const {currentPage} = this.state;
    if (currentPage > 0) {
      this.setState({currentPage: currentPage - 1});
    }
  };

  handleSearch = async searchName => {
    try {
      const erpiD= await getData(KEYS.USER_INFO);
      console.log('efeeeee',erpiD.erpID);
      if (searchName.length < 1) {
        this.setState({contractName: [], currentPage: 0}); // Clear the search results
        return;
      }
      const params = {workorderno: searchName, erpID: erpiD.erpID };
      // console.log(' Search', params);
      const response = await makeRequest(
        BASE_URL + '/mobile/searchcontractname',
        params,
      );
      const {success, message, contractName} = response;
      // console.log(response);
      if (success) {
        this.setState({contractName: contractName, currentPage: 0});
      } else {
        this.setState({contractName: [], errorMessage: message});
      }
    } catch (error) {
      console.log(error);
      this.setState({contractName: []});
    }
  };

  handleProductPress = item => {
    const {contract_id} = item;
    // Navigate to the ProductDetailScreen with the selected item
    this.props.navigation.navigate('Search_Product', {contract_id});
    // Stop refreshing and clear search term and results
    this.setState({searchName: '', contractName: []});
  };

  componentDidFocus = () => {
    this.setState({searchName: '', contractName: []}); // Clear the search term and results when screen is focused
  };

  renderProductItem = ({item}) => {
    if (!item) {
      return (
        <View style={{alignItems: 'center', paddingVertical: wp(2)}}>
          <Text>No Data</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={() => this.handleProductPress(item)}>
        <View style={{borderBottomWidth: 1, borderBottomColor: '#ccc'}}>
          <Text
            style={{
              color: 'black',
              fontWeight: '500',
              fontSize: wp(3),
              marginBottom: wp(2),
            }}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  _handleListRefresh = async () => {
    try {
      // pull-to-refresh
      this.setState({isRefreshing: true}, () => {
        // setTimeout with a delay of 1000 milliseconds (1 second)
        setTimeout(() => {
          // updating list after the delay
          this.handleProduction();
          // resetting isRefreshing after the update
          this.setState({isRefreshing: false, searchName: '', currentPage: 0});
        }, 2000);
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  handleGoBackHome = () => {
    this.props.navigation.navigate('home');
  };

  render() {
    const {logoSource}= this.state;
    const {tableHead, rowData, currentPage, rowsPerPage} = this.state;
    const startIndex = currentPage * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, rowData.length); // Calculate end index while considering the last page
    const slicedData = rowData.slice(startIndex, endIndex);
    if (this.state.isLoading) {
      return <CustomLoader />;
    }
    const {showProcessingLoader} = this.state;
    // Calculate the maximum number of lines for each cell in a row
    let maxLines = 2;
    rowData.forEach(cellData => {
      const lines = Math.ceil(cellData.length / 20); // Assuming each line has 20 characters
      if (lines > maxLines) {
        maxLines = lines;
      }
    });

    // Calculate row height based on the maximum number of lines and font size
    const rowHeight = maxLines * 25; // Assuming font size of 25

    return (
      <SafeAreaView style={{flex: 1}}>
        <View
          style={{
            backgroundColor: '#f3faf7',
            height: wp(14),
            borderRadius: wp(1),
            overflow: 'hidden',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          <TouchableOpacity onPress={this.handleGoBackHome}>
            <Image
              source={require('../../Assets/goback/prod.png')}
              style={{
                width: wp(8),
                height: wp(8),
                marginLeft: wp(2),
              }}
            />
          </TouchableOpacity>

          <Text
            style={{
              color: '#333',
              fontSize: wp(5),
              fontWeight: '500',
              letterSpacing: wp(0.4),
              textTransform: 'uppercase',
            }}>
            Production order
          </Text>

          <Image
         source={logoSource}
            style={{
              width: wp(20), // Adjust the width as needed
              height: wp(16), // Adjust the height as needed
              resizeMode: 'contain',
              marginRight: wp(2),
            }}
          />
        </View>

        <View style={styles.container}>
          <View style={styles.search}>
            <TextInput
              placeholder="Search Contract Number"
              placeholderTextColor="#40856f"
              maxLength={25}
              keyboardType="number-pad"
              value={this.state.searchName}
              onChangeText={searchName => {
                this.setState({searchName});
                this.handleSearch(searchName);
              }}
              style={styles.search_text}
            />
          </View>

          {this.state.searchName.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {this.state.contractName.length > 0 ? (
                <FlatList
                  data={this.state.contractName}
                  renderItem={this.renderProductItem}
                  // keyExtractor={(item) => item.id.toString()}
                  style={styles.searchResultsList}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No Data Found</Text>
                </View>
              )}
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this._handleListRefresh}
                colors={['#40856f']}
              />
            }>
            <Table
              style={{marginTop: wp(2)}}
              borderStyle={{borderWidth: wp(0.2), borderColor: 'white'}}>
              <Row
                data={tableHead}
                style={styles.head}
                textStyle={styles.text}
                flexArr={[0, 2, 3, 3, 1, 1]}
              />
              {slicedData.map((rowData, index) => (
                <Row
                  key={index}
                  data={[
                    <TouchableOpacity
                      key={'po_id'}
                      onPress={() => this.handlePressProductID(rowData.po_id)}>
                      <Text style={[styles.Highlight, {lineHeight: 15}]}>
                        {rowData.po_id}
                      </Text>
                    </TouchableOpacity>,

                    <Text style={[styles.rowText, {lineHeight: 15}]}>
                      {rowData.date}
                    </Text>,

                    <TouchableOpacity
                      key={'contract_name'}
                      onPress={() =>
                        this.handlePressContract(rowData.contract_id)
                      }>
                      <Text style={[styles.Highlight, {lineHeight: 15}]}>
                        {rowData.contact_name}
                      </Text>
                    </TouchableOpacity>,
                    <Text style={[styles.rowText, {lineHeight: 15}]}>
                      {rowData.product}
                    </Text>,
                    <Text style={[styles.rowText, {lineHeight: 15}]}>
                      {rowData.plannedqty}
                    </Text>,
                    <Text style={[styles.rowText, {lineHeight: 15}]}>
                      {rowData.preparedqty}
                    </Text>,
                  ]}
                  textStyle={styles.rowText}
                  style={[
                    index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                    {height: rowHeight},
                  ]}
                  flexArr={[0, 2, 3, 3, 1, 1]}
                />
              ))}
            </Table>

            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={this.prevPage}
                disabled={currentPage === 0}>
                <Text style={styles.paginationText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>Page {currentPage + 1}</Text>
              <Text style={styles.paginationText}>
                Showing {startIndex + 1} - {endIndex} of {rowData.length}{' '}
                records
              </Text>
              <TouchableOpacity
                onPress={this.nextPage}
                disabled={endIndex >= rowData.length}>
                <Text style={styles.paginationText}>Next</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        {showProcessingLoader && <ProcessingLoader />}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flex: 1,
  },
  head: {
    backgroundColor: '#40856f',
    width: wp(97),
    height: wp(12),
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: wp(3),
    fontWeight: '500',
  },
  rowEven: {
    backgroundColor: '#d2e5df',
    width: wp(97),
    height: wp(10),
  },
  rowOdd: {
    backgroundColor: '#f3faf7',
    width: wp(97),
    height: wp(10),
  },
  rowText: {
    color: '#212529',
    textAlign: 'left',
    fontSize: wp(2.5),
    paddingHorizontal: wp(0.3),
    marginLeft: 4,
    fontWeight: '400',
  },
  Highlight: {
    color: 'red',
    textAlign: 'left',
    fontSize: wp(2.5),
    fontWeight: '500',
    paddingHorizontal: wp(0.3),
    marginLeft: 4,
  },
  rowText2: {
    color: 'red',
    textAlign: 'left',
    fontSize: wp(2.6),
    paddingHorizontal: wp(0.3),
    marginLeft: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(3),
    // marginBottom:wp(12), //for ios
    marginBottom: wp(16), //for android
    marginTop: wp(4),
  },
  paginationText: {
    fontSize: wp(3.5),
    color: '#40856f',
    fontWeight: '500',
  },

  Contract_name: {
    color: '#212529',
    fontSize: wp(4),
    fontWeight: '500',
  },
  search: {
    width: wp(97),
    height: wp(12),
    borderColor: '#40856f',
    borderWidth: wp(0.3),
    borderRadius: wp(2),
    marginTop: wp(3),
    backgroundColor: '#f3faf7',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  search_text: {
    color: '#40856f',
    fontSize: wp(3.5),
    marginLeft: wp(2),
    fontWeight: '500',
  },
  popoverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popoverContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: wp(60),
    height: wp(60),
  },

  searchResultsContainer: {
    position: 'absolute',
    top: hp(8), // Adjust the top position as needed
    left: wp(2), // Adjust the left position as needed
    right: wp(2), // Adjust the right position as needed
    backgroundColor: '#fff',
    borderRadius: wp(2),
    elevation: 3,
    zIndex: 999, // Ensure the search results view is displayed above other content
  },
  searchResultsList: {
    maxHeight: hp(30), // Adjust the max height as needed
    borderRadius: wp(2),
    padding: wp(2),
  },

  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: wp(2),
  },
  noResultsText: {
    fontSize: wp(3),
    fontWeight: 'bold',
  },
});

export default Production;
