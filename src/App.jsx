import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import * as bootstrap from "bootstrap";

import './App.css'


function App() {
  const base_url = import.meta.env.VITE_BASE_URL;
  const api_path = import.meta.env.VITE_API_PATH;

  const [isAuth,setIsAuth] = useState(false);

  const [formData,setFormData] = useState({
    username:'',
    password:''
  })

  const [products,setProducts] = useState([]);

  const productModalRef = useRef(null);
  
  const [modalType,setModalType] = useState('');

  const [selectedProduct,setSelectedProduct] = useState({
    id: "",
    imageUrl: "",
    title: "",
    category: "",
    num:"",
    unit: "",
    originPrice: "",
    price: "",
    description: "",
    content: "",
    isEnabled: false,
    imagesUrl: [''],
  });

  const handleInputChange = (e) =>{
    const name = e.target.name;
    const value = e.target.value;

    setFormData({
      ...formData,
      [name]:value
    })
  }

  const handleSubmit = async (e)=>{
    e.preventDefault();

    if(!formData.username || !formData.password){
      alert('請輸入使用者信箱和密碼');
      return
    }

    try {
      const res = await axios.post(`${base_url}/admin/signin`,formData);
      const {token,expired} = res.data;
      document.cookie = `token=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common.Authorization = `${token}`;
      loginCheck();
      getProducts();
    } catch (error) {
      console.log(error);
    }

  }

  const openModal = (product,type) => {
    setSelectedProduct({
      id: product.id || "",
      imageUrl: product.imageUrl || "",
      title: product.title || "",
      category: product.category || "",
      num: product.num || "",
      unit: product.unit || "",
      originPrice: product.origin_price || "",
      price: product.price || "",
      description: product.description || "",
      content: product.content || "",
      isEnabled: product.isEnabled || false,
      imagesUrl: product.imagesUrl || [''],
    });
    productModalRef.current.show();
    setModalType(type);
  }

  const closeModal = () => {
    productModalRef.current.hide();
  };

  useEffect(()=>{
    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });  
  },[])

  const handleModalInputChange = (e)=>{
    const { id, value, type, checked } = e.target;
    setSelectedProduct((prevData)=>({
      ...prevData,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (index,value) =>{
    console.log(index,value);
    setSelectedProduct((prevData)=>{

      const newImages = [...prevData.imagesUrl];
      newImages[index]=value;
      if (
        value !== "" &&
        index === newImages.length - 1 &&
        newImages.length < 5
      ) {
        newImages.push("");
      }

      if (newImages.length > 1 && newImages[newImages.length - 1] === "") {
        newImages.pop();
      }

      return { ...prevData, imagesUrl: newImages };
      
    })
  }

  const handleAddImage = ()=>{
    setSelectedProduct((prevData)=>({
      ...prevData,
      imagesUrl:[prevData.imagesUrl,'']
    }));
  }

  const handleRemoveImage = ()=>{
    setSelectedProduct((prevData)=>{
      const newImages = [...prevData.imagesUrl];
      newImages.pop();
      return {...prevData,imagesUrl: newImages}
    });
  }

  const loginCheck = async () =>{
    try {
      const res = await axios.post(`${base_url}/api/user/check`,{});
      setIsAuth(res.data.success);
    } catch (error) {
      console.log(error);
    }
  }

  const getProducts = async () =>{
    try {
      const res = await axios.get(`${base_url}/api/${api_path}/admin/products/all`);
      setProducts(Object.values(res.data.products));
    } catch (error) {
      console.log(error);
    }
  }

  const deleteProduct = async (id)=>{
    try {
      const res = await axios.delete(`${base_url}/api/${api_path}/admin/product/${id}`);
      console.log(res);
      productModalRef.current.hide();
      getProducts();
    } catch (error) {
      alert(error.response.data.message);
    }
  }

  const updateProduct = async (id)=>{

    const productData = {
      data:{
        ...selectedProduct,
        origin_price: Number(selectedProduct.originPrice),
        price: Number(selectedProduct.price),
        is_enabled: selectedProduct.isEnabled ? 1 : 0,
        imagesUrl: selectedProduct.imagesUrl,
      },
    };

    try {
      if(modalType === 'edit'){
        const res = await axios.put(`${base_url}/api/${api_path}/admin/product/${id}`,productData);
        console.log(res.data);
      }else{
        const res = await axios.post(`${base_url}/api/${api_path}/admin/product`,productData);
        console.log(res.data);
      }
      productModalRef.current.hide();
      getProducts();

    } catch (error) {
      if(modalType === 'edit'){
        console.log('更新失敗:',error.response.data.message);
      }else{
        console.log('新增失敗:',error.response.data.message);
      }
    }
  }



  return (
    <>
      {
        isAuth?(
          <div className='container'>
            <h2 className='text-start'>產品清單</h2>
            <div className='text-end'>
              <button className='btn btn-warning' type='button' onClick={()=>openModal({},"add")}>
                新增產品
              </button>
            </div>
            <table className='table'>
              <thead>
                <tr>
                  <th>產品名稱</th>
                  <th>分類</th>
                  <th>原價</th>
                  <th>售價</th>
                  <th>數量</th>
                  <th>單位</th>
                  <th>是否啟用</th>
                  <th>編輯</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product)=>{
                  return (
                    <tr key={product.id}>
                      <td>{product.title}</td>
                      <td>{product.category}</td>
                      <td>{product.origin_price}/元</td>
                      <td>{product.price}/元</td>
                      <td>{product.num}</td>
                      <td>{product.unit}</td>
                      <td>{product.is_enabled?'已啟用':'未啟用'}</td>
                      <td>
                        <div className='btn-group'>
                          <button type='button' className='btn btn-warning btn-sm' onClick={()=>openModal(product,'edit')}>編輯</button>
                          <button type='button' className='btn btn-danger btn-sm' onClick={()=>openModal(product,'delete')}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ):(
          <div className='container'>
            <h2>請登入</h2>
            <form className='form g-3' onSubmit={handleSubmit}>
              <div className="mb-3 row">
                <label htmlFor="username" className='col-form-label col-2 text-start'>使用者信箱{formData.username}</label>
                <input type="email" id='username' className='col-form-control col-10' name='username' onChange={handleInputChange} required />
              </div>
              <div className="mb-3 row">
                <label htmlFor="password" className='col-form-label col-2 text-start'>密碼{formData.password}</label>
                <input type="password" id='password' className='col-form-control col-10' name='password' onChange={handleInputChange} required />
              </div>
              <div className="mb-3 row">
                <button type='submit' className='btn btn-warning'>登入</button>
              </div>
            </form>
          </div>
        )
      }
      <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" ref={productModalRef} aria-hidden="true">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className={`modal-header ${modalType === 'delete'? 'bg-danger' : 'bg-warning'} text-white`}>
              <h5 className="modal-title" id="productModalLabel">
                <span>
                  {
                    modalType === 'delete'?'刪除產品':
                    modalType === 'edit'?'編輯產品':
                    '新增產品'
                  }
                </span>
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              {
                modalType === 'delete'?(
                  <p className='h4'>確定要刪除
                    <span className='text-danger'>{selectedProduct.title}</span>
                    嗎？
                  </p>
                ):(
                  <div className="row">
                    <div className="col-4">
                      <div className="mb-2">
                        <div className='mb-3'>
                          <label htmlFor="imageUrl" className='form-label'>請輸入圖片網址</label>
                          <input type="text" className='form-control' id='imageUrl' placeholder='請輸入圖片連結' value={selectedProduct.imageUrl} onChange={handleModalInputChange}/>
                        </div>
                        <img src={selectedProduct.imageUrl} className='img-fluid' alt="主圖" />
                      </div>
                      <div>
                        {selectedProduct.imagesUrl.map((imgUrl,index) => (
                          <div className='mb-2' key={index}>
                            <input type="text" className='mb-2 form-control' value={imgUrl} onChange={(e)=>handleImageChange(index,e.target.value)}/>
                            {imgUrl && (<img src={imgUrl} className='mb-2 img-preview' alt={`附圖${index+1}`} />)}
                          </div>
                        ))}
                        <div className="d-flex justify-content-between">
                          {
                            selectedProduct.imagesUrl.length < 5 && 
                            selectedProduct.imagesUrl[selectedProduct.imagesUrl.length-1] !== '' && 
                            (<button className='btn btn-warning btn-sm' onClick={handleAddImage}>新增圖片</button>)
                          }

                          {
                            selectedProduct.imagesUrl.length >=1 && 
                            (<button className='btn btn-danger btn-sm' onClick={handleRemoveImage}>取消圖片</button>)
                          }
                        </div>
                      </div>
                    </div>
                    <div className="col-8">
                      <div className="row">
                        <div className="mb-3 col-6">
                          <label htmlFor="title" className='form-label'>標題</label>
                          <input type="text" placeholder='請輸入標題' className='form-control' id='title' value={selectedProduct.title} onChange={handleModalInputChange}/>
                        </div>
                        <div className="mb-3 col-6">
                          <label htmlFor="category" className='form-label'>分類</label>
                          <input type="text" placeholder='請輸入分類' className='form-control' id='category' value={selectedProduct.category} onChange={handleModalInputChange}/>
                        </div>
                        <div className="mb-3 col-6">
                          <label htmlFor="num" className='form-label'>數量</label>
                          <input type="text" placeholder='請輸入數量' className='form-control' id='num' value={selectedProduct.num} onChange={handleModalInputChange}/>
                        </div>
                        <div className="mb-3 col-6">
                          <label htmlFor="unit" className='form-label'>單位</label>
                          <input type="text" placeholder='請輸入單位' className='form-control' id='unit' value={selectedProduct.unit} onChange={handleModalInputChange}/>
                        </div>
                        <div className="mb-3 col-6">
                          <label htmlFor="originPrice" className='form-label'>原價</label>
                          <input type="text" placeholder='請輸入原價' className='form-control' id='originPrice' value={selectedProduct.originPrice} onChange={handleModalInputChange}/>
                        </div>
                        <div className="mb-3 col-6">
                          <label htmlFor="price" className='form-label'>售價</label>
                          <input type="text" placeholder='請輸入售價' className='form-control' id='price' value={selectedProduct.price} onChange={handleModalInputChange}/>
                        </div>
                        <div className="col-12 mb-3">
                          <label htmlFor="description" className='form-label'>商品描述</label>
                          <textarea type="text" placeholder='請輸入商品描述' className='form-control' id='description' value={selectedProduct.description} onChange={handleModalInputChange}/>
                        </div>
                        <div className="col-12 mb-3">
                          <label htmlFor="content" className='form-label'>商品內容</label>
                          <textarea type="text" placeholder='請輸入商品內容' className='form-control' id='content' value={selectedProduct.content} onChange={handleModalInputChange}/>
                        </div>
                        <div className="col-12 mb-3">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" value={selectedProduct.is_enabled} id="isEnabled" onChange={handleModalInputChange} />
                            <label className="form-check-label" htmlFor="isEnabled">
                              是否啟用
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={closeModal}>取消</button>
              {
                modalType ==='delete' ? 
                (<button type="button" className="btn btn-danger" onClick={()=>deleteProduct(selectedProduct.id)}>刪除</button>):
                (<button type="button" className="btn btn-warning" onClick={()=>updateProduct(selectedProduct.id)}>確認</button>)
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
