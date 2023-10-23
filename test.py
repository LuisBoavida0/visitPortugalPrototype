import pywebcopy
from pywebcopy import save_website

kwargs = {'project_name': 'destinies'} # it will create a folder in desired folder with name 'talalsite'

save_website(
    url='https://www.visitportugal.com/en/destinos',
    project_folder='E:/3Year/ux/prototype/pythoncopy',
    **kwargs
)
