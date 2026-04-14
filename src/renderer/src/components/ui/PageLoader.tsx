import logoCheckmark from '../../assets/logo-checkmark.svg'

export default function PageLoader() {
  return (
    <>
      <div className="page-loading-bar" />
      <div className="flex items-center justify-center h-full w-full min-h-[200px]">
        <img
          src={logoCheckmark}
          alt=""
          className="w-10 h-10 page-loader-logo"
        />
      </div>
    </>
  )
}
